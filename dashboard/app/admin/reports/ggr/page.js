import { getAdminGgrReport } from "../../../../../src/lib/api";

function formatCurrency(value, currency = "INR") {
  if (value === undefined || value === null) return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency || "INR"}`;
  }
}

function formatInputDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function NumberSeriesChart({ series = [], currency = "INR" }) {
  if (!series.length) {
    return (
      <div className="text-sm text-slate-500 text-center py-6">No number series data available.</div>
    );
  }

  const maxBet = Math.max(...series.map((row) => Number(row.betAmount) || 0), 1);

  return (
    <div className="space-y-2">
      {series.map((row) => {
        const pct = ((Number(row.betAmount) || 0) / maxBet) * 100;
        return (
          <div key={row.number}>
            <div className="flex justify-between text-xs text-slate-500">
              <span>No. {row.number}</span>
              <span>{formatCurrency(row.betAmount, currency)}</span>
            </div>
            <div className="h-4 rounded bg-slate-100 overflow-hidden">
              <div
                className={`h-full ${row.win ? "bg-green-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
                aria-label={`Bet volume ${formatCurrency(row.betAmount, currency)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminGgrDashboard({ searchParams }) {
  const resolvedParams = (await searchParams) ?? {};
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setHours(0, 0, 0, 0);
  const defaultEnd = now;

  const startDateParam = resolvedParams.startDate || defaultStart.toISOString();
  const endDateParam = resolvedParams.endDate || defaultEnd.toISOString();
  const tenantId = resolvedParams.tenantId || "";
  const platformPercent = resolvedParams.platformPercent || "";
  const currency = (resolvedParams.currency || "").toUpperCase();

  let payload = null;
  let error = null;

  try {
    payload = await getAdminGgrReport({
      startDate: startDateParam,
      endDate: endDateParam,
      tenantId: tenantId.trim() || undefined,
      platformPercent: platformPercent || undefined,
      currency: currency || undefined,
    });
  } catch (err) {
    error = err.message || "Failed to fetch GGR data.";
  }

  const totals = payload?.totals || {};
  const numberSeries = payload?.numberSeries || [];
  const range = payload?.range;
  const currencyBreakdown = payload?.currencyBreakdown || [];
  const totalsCurrency = totals?.currency;
  const singleCurrency = totalsCurrency && totalsCurrency !== "MIXED";
  const displayCurrency = singleCurrency ? totalsCurrency : currency || "INR";

  const formatOrMixed = (value) =>
    singleCurrency ? formatCurrency(value, displayCurrency) : "Mixed (filter by currency)";

  const cards = [
    { label: `Bet Volume${singleCurrency ? ` (${displayCurrency})` : ""}`, value: formatOrMixed(totals.betVolume) },
    { label: `Payouts${singleCurrency ? ` (${displayCurrency})` : ""}`, value: formatOrMixed(totals.payouts) },
    { label: `Gross Gaming Revenue${singleCurrency ? ` (${displayCurrency})` : ""}`, value: formatOrMixed(totals.ggr) },
    {
      label: `Platform Share (${totals.platformShare?.percentage || 0}%)`,
      value:
        totals.platformShare?.amount != null && singleCurrency
          ? formatCurrency(totals.platformShare.amount, displayCurrency)
          : "—",
    },
  ];

  const TotalsBar = () => {
    if (!singleCurrency) {
      return (
        <div className="card bg-base-100 shadow rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Bet vs Payout Mix</p>
          <p className="text-xs text-slate-500">
            Apply a currency filter to view the bet vs payout mix. Multiple currencies detected.
          </p>
        </div>
      );
    }
    const bets = Number(totals.betVolume) || 0;
    const payouts = Number(totals.payouts) || 0;
    const safeTotal = bets + payouts || 1;
    const betPct = ((bets / safeTotal) * 100).toFixed(1);
    const payoutPct = ((payouts / safeTotal) * 100).toFixed(1);

    return (
      <div className="card bg-base-100 shadow rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Bet vs Payout Mix</p>
          <p className="text-xs text-slate-500">By volume</p>
        </div>
        <div className="h-6 rounded bg-slate-200 overflow-hidden flex">
          <div className="bg-indigo-500 h-full" style={{ width: `${betPct}%` }} title={`Bet Volume ${betPct}%`} />
          <div className="bg-amber-400 h-full" style={{ width: `${payoutPct}%` }} title={`Payouts ${payoutPct}%`} />
        </div>
        <div className="flex justify-between text-xs text-slate-600">
          <span>Bet Volume ({betPct}%)</span>
          <span>Payouts ({payoutPct}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Reports</p>
        <h1 className="text-3xl font-bold text-slate-900">GGR Dashboard</h1>
        <p className="text-sm text-slate-600">Track bet volume, payouts, and platform share for the selected window.</p>
      </div>

      <form className="grid gap-4 rounded-xl bg-base-100 p-4 shadow md:grid-cols-6" method="get">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Start</label>
          <input
            type="datetime-local"
            name="startDate"
            className="input input-bordered input-sm w-full"
            defaultValue={formatInputDate(startDateParam)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">End</label>
          <input
            type="datetime-local"
            name="endDate"
            className="input input-bordered input-sm w-full"
            defaultValue={formatInputDate(endDateParam)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Tenant ID</label>
          <input
            name="tenantId"
            placeholder="optional"
            className="input input-bordered input-sm w-full"
            defaultValue={tenantId}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Platform %</label>
          <input
            name="platformPercent"
            type="number"
            min="0"
            step="0.1"
            className="input input-bordered input-sm w-full"
            defaultValue={platformPercent}
            placeholder="10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Currency</label>
          <input
            name="currency"
            placeholder="INR"
            className="input input-bordered input-sm w-full"
            defaultValue={currency}
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn btn-primary btn-sm w-full">
            Apply Filters
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {range && (
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Range: {new Date(range.startDate).toLocaleString()} – {new Date(range.endDate).toLocaleString()}
          {tenantId && <span className="ml-2 text-indigo-600">Tenant: {tenantId.toUpperCase()}</span>}
          {currency && <span className="ml-2 text-indigo-600">Currency: {currency}</span>}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>
      <TotalsBar />

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <h2 className="card-title text-sm font-semibold text-slate-700">Currency Breakdown</h2>
        <p className="text-xs text-slate-500 mb-4">
          Shows bet volume, payouts, and GGR recorded per currency. Apply a currency filter to focus on a single denomination.
        </p>
        <div className="overflow-x-auto">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>Currency</th>
                <th>Bet Volume</th>
                <th>Payouts</th>
                <th>GGR</th>
              </tr>
            </thead>
            <tbody>
              {currencyBreakdown.map((row) => (
                <tr key={row.currency}>
                  <td>{row.currency}</td>
                  <td>{formatCurrency(row.betVolume, row.currency)}</td>
                  <td>{formatCurrency(row.payouts, row.currency)}</td>
                  <td>{formatCurrency(row.ggr, row.currency)}</td>
                </tr>
              ))}
              {!currencyBreakdown.length && (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-6">
                    No round data available for the selected window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card bg-base-100 shadow rounded-xl p-4 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="card-title text-sm font-semibold text-slate-700">Number Series</h2>
            <p className="text-xs text-slate-500">
              Player counts & bet distribution per number. Highlighted rows indicate wins.
            </p>
          </div>
        </div>
        <NumberSeriesChart series={numberSeries} currency={displayCurrency} />
        <div className="overflow-x-auto mt-4">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>Number</th>
                <th>Players</th>
                <th>Bet Amount</th>
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              {numberSeries.map((row) => (
                <tr key={row.number} className={row.win ? "bg-green-50 font-semibold" : ""}>
                  <td>{row.number}</td>
                  <td>{row.playerCount}</td>
                  <td>{formatCurrency(row.betAmount, displayCurrency)}</td>
                  <td>
                    {row.win ? (
                      <span className="badge badge-success badge-sm">WIN</span>
                    ) : (
                      <span className="badge badge-outline badge-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {!numberSeries.length && (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-6">
                    No number series data available.
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
