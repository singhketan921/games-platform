import { getAdminReconciliationRounds, getAdminRtpDeviationSummary } from "../../../../../src/lib/api";

function formatAmount(value, currency = "INR") {
  if (value === undefined || value === null) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency || "INR"}`;
  }
}

function formatPercent(value) {
  if (value === undefined || value === null) return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
}

function deviationBadge(value) {
  if (value === undefined || value === null) return <span className="badge badge-sm badge-neutral">-</span>;
  const val = Number(value);
  let tone = "badge-neutral";
  if (val > 0.01) tone = "badge-success";
  else if (val < -0.01) tone = "badge-error";
  else if (Math.abs(val) >= 0.005) tone = "badge-warning";

  return <span className={`badge badge-sm ${tone}`}>{formatPercent(val)}</span>;
}

const STATUS_OPTIONS = ["PENDING", "RECONCILED", "MISMATCH", "ERROR"];

export default async function AdminReconciliationPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const filters = {
    tenantId: params.tenantId || "",
    status: params.status || "",
    gameId: params.gameId || "",
    minDiscrepancy: params.minDiscrepancy || "",
    startDate: params.startDate || "",
    endDate: params.endDate || "",
    currency: (params.currency || "").toUpperCase(),
    limit: params.limit || "100",
  };
  const activeCurrency = filters.currency || "INR";

  let payload = null;
  let error = null;
  let rtpSummary = null;
  try {
    [payload, rtpSummary] = await Promise.all([
      getAdminReconciliationRounds({
        tenantId: filters.tenantId || undefined,
        status: filters.status || undefined,
        gameId: filters.gameId || undefined,
        minDiscrepancy: filters.minDiscrepancy || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        currency: filters.currency || undefined,
        limit: filters.limit || undefined,
      }),
      getAdminRtpDeviationSummary({
        tenantId: filters.tenantId || undefined,
        gameId: filters.gameId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        currency: filters.currency || undefined,
        limit: 25,
      }),
    ]);
  } catch (err) {
    error = err.message || "Failed to load reconciliation data.";
  }

  const rounds = payload?.rounds || [];
  const summary = payload?.summary || { counts: [], discrepancyTotal: 0 };
  const tenantRtp = rtpSummary?.tenantSummaries || [];
  const tenantGameRtp = rtpSummary?.tenantGameSummaries || [];
  const exportSearch = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) exportSearch.set(key, value);
  });
  const exportHref = `/admin/reconciliation/export.csv${exportSearch.toString() ? `?${exportSearch.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Reports</p>
        <h1 className="text-3xl font-bold text-slate-900">Reconciliation</h1>
        <p className="text-sm text-slate-600">
          Track round-level wallet deltas and investigate discrepancies across tenants.
        </p>
      </div>

      <form className="grid gap-4 rounded-xl bg-base-100 p-4 shadow md:grid-cols-6" method="get">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Tenant</label>
          <input name="tenantId" className="input input-bordered input-sm w-full" defaultValue={filters.tenantId} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Game ID</label>
          <input name="gameId" className="input input-bordered input-sm w-full" defaultValue={filters.gameId} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
          <select name="status" className="select select-bordered select-sm w-full" defaultValue={filters.status}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Min Discrepancy</label>
          <input
            name="minDiscrepancy"
            type="number"
            step="0.01"
            className="input input-bordered input-sm w-full"
            defaultValue={filters.minDiscrepancy}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Start</label>
          <input name="startDate" type="date" className="input input-bordered input-sm w-full" defaultValue={filters.startDate} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">End</label>
          <input name="endDate" type="date" className="input input-bordered input-sm w-full" defaultValue={filters.endDate} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Currency</label>
          <input
            name="currency"
            className="input input-bordered input-sm w-full"
            placeholder="INR"
            defaultValue={filters.currency}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Limit</label>
          <input name="limit" type="number" className="input input-bordered input-sm w-full" defaultValue={filters.limit} />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn btn-primary btn-sm w-full">
            Apply Filters
          </button>
        </div>
        <div className="flex items-end">
          <a href={exportHref} className="btn btn-outline btn-sm w-full">
            Export CSV
          </a>
        </div>
      </form>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {summary.counts?.map((entry) => (
          <div key={entry.status} className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{entry.status}</p>
            <p className="text-2xl font-semibold text-slate-900">{entry.count}</p>
          </div>
        ))}
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Discrepancy Total</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatAmount(summary.discrepancyTotal, activeCurrency)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-sm font-semibold text-slate-700">RTP deviation by tenant</h2>
            <span className="text-xs text-slate-500">{tenantRtp.length ? `${tenantRtp.length} tenants` : "No data"}</span>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Currency</th>
                  <th>Rounds</th>
                  <th>Bet Volume</th>
                  <th>Actual RTP</th>
                  <th>Target RTP</th>
                  <th>Deviation</th>
                </tr>
              </thead>
              <tbody>
                {tenantRtp.map((row) => (
                  <tr key={`${row.tenantId}-${row.currency || "INR"}`}>
                    <td>{row.tenantId}</td>
                    <td>{row.currency || "INR"}</td>
                    <td>{row.rounds}</td>
                    <td>{formatAmount(row.totalBets, row.currency || "INR")}</td>
                    <td>{formatPercent(row.actualRtp)}</td>
                    <td>{formatPercent(row.targetRtp)}</td>
                    <td>{deviationBadge(row.deviation)}</td>
                  </tr>
                ))}
                {!tenantRtp.length && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-500 py-6">
                      No tenant level RTP data in range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card bg-base-100 shadow rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-sm font-semibold text-slate-700">Top tenant / game deviations</h2>
            <span className="text-xs text-slate-500">
              {tenantGameRtp.length ? `Top ${tenantGameRtp.length}` : "No data"}
            </span>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Game</th>
                  <th>Profile</th>
                  <th>Currency</th>
                  <th>Bet Volume</th>
                  <th>Payouts</th>
                  <th>Actual RTP</th>
                  <th>Target RTP</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {tenantGameRtp.map((row) => (
                  <tr key={`${row.tenantId}-${row.gameId}-${row.currency || "INR"}`}>
                    <td>{row.tenantId}</td>
                    <td>{row.gameId}</td>
                    <td>{row.rtpProfile || "—"}</td>
                    <td>{row.currency || "INR"}</td>
                    <td>{formatAmount(row.totalBets, row.currency || "INR")}</td>
                    <td>{formatAmount(row.totalPayouts, row.currency || "INR")}</td>
                    <td>{formatPercent(row.actualRtp)}</td>
                    <td>{formatPercent(row.targetRtp)}</td>
                    <td>{deviationBadge(row.deviation)}</td>
                  </tr>
                ))}
                {!tenantGameRtp.length && (
                  <tr>
                    <td colSpan={9} className="text-center text-slate-500 py-6">
                      No tenant-game combinations with data for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-sm font-semibold text-slate-700">Recent Rounds</h2>
          <span className="text-xs text-slate-500">Showing {rounds.length} rows</span>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>Round</th>
                <th>Tenant</th>
                <th>Game</th>
                <th>Player</th>
                <th>Bet</th>
                <th>Payout</th>
                <th>Currency</th>
                <th>Discrepancy</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round.id}>
                  <td className="font-mono text-[11px]">{round.id?.slice(0, 8)}...</td>
                  <td>{round.tenantId}</td>
                  <td>{round.gameId}</td>
                  <td>{round.playerId}</td>
                  <td>{formatAmount(round.betAmount, round.currency || activeCurrency)}</td>
                  <td>{formatAmount(round.payoutAmount, round.currency || activeCurrency)}</td>
                  <td>{round.currency || "INR"}</td>
                  <td>{formatAmount(round.discrepancy, round.currency || activeCurrency)}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        round.status === "RECONCILED"
                          ? "badge-success"
                          : round.status === "MISMATCH"
                          ? "badge-warning"
                          : round.status === "ERROR"
                          ? "badge-error"
                          : "badge-info"
                      }`}
                    >
                      {round.status}
                    </span>
                  </td>
                  <td>{round.createdAt ? new Date(round.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {!rounds.length && (
                <tr>
                  <td colSpan={10} className="text-center text-slate-500 py-6">
                    No rounds match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
