import { cookies } from "next/headers";
import {
  getTenantProfile,
  getTenantSessions,
  getTenantWalletHistory,
} from "../../../src/lib/tenantApi";
import WalletActionForm from "../WalletActionForm";
import WalletCsvButton from "../WalletCsvButton";

export default async function TenantWalletPage({ searchParams }) {
  const resolved = (await searchParams) ?? {};
  const cookieStore = cookies();
  const cookieCurrency = cookieStore.get("tenant-preferred-currency")?.value || null;

  let profile = null;
  let profileError = null;
  try {
    profile = await getTenantProfile();
  } catch (error) {
    profileError = error.message || "Failed to load tenant profile.";
  }

  const userRole = profile?.user?.role || "UNKNOWN";
  const canMutate = userRole === "OPERATOR";
  let sessionsError = null;
  let walletError = null;

  const sessionsPayload = await getTenantSessions().catch((error) => {
    sessionsError = error.message || "Failed to fetch sessions.";
    return null;
  });
  const sessions = sessionsPayload?.sessions || [];
  const defaultPlayer = sessions[0]?.playerId;
  const playerId = (resolved.playerId || defaultPlayer || "").toString();
  const history = playerId
    ? await getTenantWalletHistory(playerId).catch((error) => {
        walletError = error.message || "Failed to fetch wallet history.";
        return { history: [] };
      })
    : { history: [] };
  const balances = profile?.balances || [];
  const globalError = sessionsError || walletError || profileError;
  const preferred = cookieCurrency || balances[0]?.currency || "INR";
  const formatAmount = (value, currency = preferred) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    const resolvedCurrency = currency || preferred;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: resolvedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numeric);
    } catch {
      return `${numeric.toFixed(2)} ${resolvedCurrency}`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant</p>
        <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
        <p className="text-sm text-slate-600">Track wallet transactions per player.</p>
      </div>

      <form className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="label">
            <span className="label-text text-sm font-medium">Player ID</span>
          </label>
          <input
            name="playerId"
            defaultValue={playerId}
            className="input input-bordered w-full"
            placeholder="player-123"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Fetch History
        </button>
      </form>

      {globalError && (
        <div role="alert" className="alert alert-warning text-sm">
          {globalError}
        </div>
      )}

      {!canMutate && (
        <div role="alert" className="alert alert-info text-xs">
          You are signed in as <span className="font-semibold">{userRole}</span>. Wallet debits/credits
          are limited to operator accounts. You can still view balances and history.
        </div>
      )}

      {canMutate && (
        <div className="grid gap-4 md:grid-cols-2">
          <WalletActionForm kind="debit" canMutate={canMutate} defaultPlayer={playerId} />
          <WalletActionForm kind="credit" canMutate={canMutate} defaultPlayer={playerId} />
        </div>
      )}

      {balances.length > 0 && (
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Current Balances</h2>
          <div className="grid gap-3 mt-4 md:grid-cols-2">
            {balances.map((balance) => (
              <div key={balance.currency} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{balance.currency}</p>
                <p className="text-xl font-semibold text-slate-900">
                  {formatAmount(balance.balance, balance.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-base-100 p-4 rounded-xl shadow space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-sm font-semibold text-slate-700">Transaction History</h2>
          <WalletCsvButton history={history.history || []} playerId={playerId} />
        </div>
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history?.history?.map((tx) => (
              <tr key={tx.id}>
                <td className="font-mono text-xs">{tx.id}</td>
                <td>
                  <span
                    className={`badge badge-sm ${
                      tx.type === "CREDIT" ? "badge-success" : "badge-warning"
                    }`}
                  >
                    {tx.type}
                  </span>
                </td>
                <td>{formatAmount(tx.amount, tx.currency || "INR")}</td>
                <td>{tx.reference || "-"}</td>
                <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {(!history?.history || history.history.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-6">
                  {playerId ? "No wallet activity for this player." : "Enter a player ID to search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
