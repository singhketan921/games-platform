import Link from "next/link";
import { getTenantSessionDetail } from "../../../../src/lib/tenantApi";

export default async function TenantSessionDetailPage({ params }) {
  const { sessionId } = await params;
  let payload = null;
  let error = null;
  try {
    payload = await getTenantSessionDetail(sessionId);
  } catch (err) {
    error = err.message || "Failed to load session";
  }

  const session = payload?.session;
  const transactions = payload?.transactions || [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Session Detail</h1>
          <Link href="/tenant/sessions" className="link link-primary text-sm">
            ? Back to sessions
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm">
          {error}
        </div>
      )}

      {session && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card bg-base-100 shadow rounded-xl p-4 space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Identifiers</p>
            <p className="font-mono text-xs text-slate-500">{session.id}</p>
            <p>Player: {session.playerId}</p>
            <p>Game: {session.gameId}</p>
          </div>
          <div className="card bg-base-100 shadow rounded-xl p-4 space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
            <p>Bet Amount: {session.betAmount}</p>
            <p>Started: {session.startedAt ? new Date(session.startedAt).toLocaleString() : "-"}</p>
            <p>Ended: {session.endedAt ? new Date(session.endedAt).toLocaleString() : "—"}</p>
            <p>
              State:
              <span className={adge badge-sm ml-2 }>
                {session.isClosed ? "Closed" : "Open"}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <h2 className="card-title text-sm font-semibold text-slate-700">Related Transactions</h2>
        <div className="overflow-x-auto mt-4">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-[11px]">{tx.id}</td>
                  <td>{tx.type}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.reference || "-"}</td>
                  <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
              {!transactions.length && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-6">
                    No transactions found for this session.
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