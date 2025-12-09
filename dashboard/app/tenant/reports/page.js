import { getTenantSessions, getTenantGgrReport } from "../../../src/lib/tenantApi";
import { useTenantProfile } from "../useTenantProfile";

function formatAmount(value = 0, currency = "INR") {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  if (!currency || currency === "MIXED") {
    return `${numeric.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${
      currency && currency !== "MIXED" ? ` ${currency}` : currency === "MIXED" ? " (mixed)" : ""
    }`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency}`;
  }
}

export default async function TenantReportsPage({ searchParams }) {
  const { profile, profileError, preferredCurrency } = useTenantProfile();
  let sessionsError = null;
  let ggrError = null;

  const sessionsPayload = await getTenantSessions().catch((error) => {
    sessionsError = error.message || "Failed to fetch sessions.";
    return null;
  });

  const filters = {
    startDate: searchParams?.startDate || "",
    endDate: searchParams?.endDate || "",
    currency: (searchParams?.currency || "").toUpperCase(),
    platformPercent: searchParams?.platformPercent || "",
  };
  const resolvedCurrencyFilter = filters.currency || preferredCurrency || "";

  const ggrReport = await getTenantGgrReport({
    startDate: filters.startDate,
    endDate: filters.endDate,
    currency: resolvedCurrencyFilter || undefined,
    platformPercent: filters.platformPercent || undefined,
  }).catch((error) => {
    ggrError = error.message || "Failed to load GGR report.";
    return null;
  });

  const sessions = sessionsPayload?.sessions || [];
  const totalBets =
    ggrReport?.totals?.betVolume ??
    profile?.metrics?.totalBetVolume ??
    sessions.reduce((sum, session) => sum + Number(session.betAmount || 0), 0);
  const payouts = ggrReport?.totals?.payouts ?? profile?.metrics?.totalPayouts ?? 0;
  const ggr =
    ggrReport?.totals?.ggr ??
    profile?.metrics?.grossGamingRevenue ??
    totalBets - payouts;
  const totalsCurrency = ggrReport?.totals?.currency || "INR";
  const breakdown = ggrReport?.currencyBreakdown || [];
  const platformShare = ggrReport?.totals?.platformShare;
  const currencyOptions = Array.from(
    new Set([
      ...(profile?.balances?.map((balance) => balance.currency) || []),
      ...breakdown.map((row) => row.currency),
      ...(preferredCurrency ? [preferredCurrency] : []),
    ])
  ).sort();
  const globalError = sessionsError || profileError || ggrError;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant</p>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">
          Daily summaries and gross gaming revenue estimates with currency filters.
        </p>
      </div>

      {globalError && (
        <div role="alert" className="alert alert-warning text-sm">
          {globalError}
        </div>
      )}

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <h2 className="card-title text-sm font-semibold text-slate-700">Filters</h2>
        <form className="mt-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0" method="GET">
          <label className="form-control w-full">
            <span className="label-text text-xs uppercase tracking-[0.3em] text-slate-500">
              Start Date
            </span>
            <input
              type="date"
              name="startDate"
              className="input input-bordered"
              defaultValue={filters.startDate ? filters.startDate.slice(0, 10) : ""}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-xs uppercase tracking-[0.3em] text-slate-500">
              End Date
            </span>
            <input
              type="date"
              name="endDate"
              className="input input-bordered"
              defaultValue={filters.endDate ? filters.endDate.slice(0, 10) : ""}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-xs uppercase tracking-[0.3em] text-slate-500">
              Currency
            </span>
            <select
              name="currency"
              className="select select-bordered"
              defaultValue={resolvedCurrencyFilter}
            >
              <option value="">All</option>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control w-full">
            <span className="label-text text-xs uppercase tracking-[0.3em] text-slate-500">
              Platform % (optional)
            </span>
            <input
              type="number"
              name="platformPercent"
              className="input input-bordered"
              min="0"
              step="0.1"
              placeholder="10"
              defaultValue={filters.platformPercent}
            />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">
              Apply Filters
            </button>
            <a href="/tenant/reports" className="btn btn-ghost btn-sm">
              Reset
            </a>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Bet Volume</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatAmount(totalBets, totalsCurrency)}
          </p>
        </div>
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Payouts</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatAmount(payouts, totalsCurrency)}
          </p>
        </div>
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gross Gaming Revenue</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatAmount(ggr, totalsCurrency)}
          </p>
          {platformShare && (
            <p className="text-xs text-slate-500 mt-1">
              Platform share ({platformShare.percentage}%):{" "}
              {platformShare.amount !== null
                ? formatAmount(platformShare.amount, totalsCurrency)
                : "Enable single currency to compute"}
            </p>
          )}
        </div>
      </div>

      {breakdown.length ? (
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">
            Currency Breakdown
          </h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra text-sm">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Bet Volume</th>
                  <th>Payouts</th>
                  <th>GGR</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row.currency}>
                    <td>{row.currency}</td>
                    <td>{formatAmount(row.betVolume, row.currency)}</td>
                    <td>{formatAmount(row.payouts, row.currency)}</td>
                    <td>{formatAmount(row.ggr, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {profile?.balances?.length ? (
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Wallet Balances</h2>
          <div className="grid gap-3 mt-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.balances.map((balance) => (
              <div key={balance.currency} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{balance.currency}</p>
                <p className="text-xl font-semibold text-slate-900">
                  {formatAmount(balance.balance, balance.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <h2 className="card-title text-sm font-semibold text-slate-700">Session Breakdown</h2>
        <div className="overflow-x-auto mt-4">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>Player</th>
                <th>Game</th>
                <th>Bet</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 10).map((session) => (
                <tr key={session.id}>
                  <td>{session.playerId}</td>
                  <td>{session.gameId}</td>
                  <td>{session.betAmount}</td>
                  <td>{session.isClosed ? "Closed" : "Open"}</td>
                </tr>
              ))}
              {!sessions.length && (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-4">
                    No session data yet.
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
