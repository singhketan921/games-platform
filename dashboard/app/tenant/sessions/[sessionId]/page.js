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
            &larr; Back to sessions
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
          <div className="card space-y-1 rounded-xl bg-base-100 p-4 shadow">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Identifiers</p>
            <p className="font-mono text-xs text-slate-500">{session.id}</p>
            <p>Player: {session.playerId}</p>
            <p>Game: {session.gameId}</p>
          </div>
          <div className="card space-y-1 rounded-xl bg-base-100 p-4 shadow">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
            <p>Bet Amount: {session.betAmount}</p>
            <p>Started: {session.startedAt ? new Date(session.startedAt).toLocaleString() : "-"}</p>
            <p>Ended: {session.endedAt ? new Date(session.endedAt).toLocaleString() : "-"}</p>
            <p className="flex items-center gap-2">
              State:
              <span className={`badge badge-sm ${session.isClosed ? "badge-success" : "badge-warning"}`}>
                {session.isClosed ? "Closed" : "Open"}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="card rounded-xl bg-base-100 p-4 shadow">
        <h2 className="card-title text-sm font-semibold text-slate-700">Related Transactions</h2>
        <div className="mt-4 overflow-x-auto">
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
                  <td colSpan={5} className="py-6 text-center text-slate-500">
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
