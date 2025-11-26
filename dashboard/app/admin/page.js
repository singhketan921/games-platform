import { tenants, sessions, callbacks, transactions } from "./mockData";

const stats = [
  { label: "Total Tenants", value: tenants.length },
  { label: "Total Games", value: 7 },
  { label: "Total Sessions", value: sessions.length },
  { label: "Total Callbacks", value: callbacks.length },
];

const totalVolume = transactions.reduce(
  (sum, txn) => sum + Math.abs(txn.amount),
  0
);

const statusBadge = (status) => {
  const map = {
    Won: "badge badge-success",
    Lost: "badge badge-error",
    "In Progress": "badge badge-warning",
    Closed: "badge badge-info",
  };
  return map[status] || "badge";
};

const recentSessions = [...sessions]
  .sort(
    (a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0)
  )
  .slice(0, 5);

export default function AdminOverviewPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Admin Dashboard
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stats bg-base-100 shadow-md rounded-xl p-4"
          >
            <div className="stat">
              <div className="stat-title text-xs uppercase tracking-[0.3em] text-slate-500">
                {stat.label}
              </div>
              <div className="stat-value mt-2 text-3xl font-bold text-slate-900">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
        <div className="stats bg-base-100 shadow-md rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.3em] text-slate-500">
              Total Volume
            </div>
            <div className="stat-value mt-2 text-3xl font-bold text-slate-900">
              ${totalVolume.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Sessions</h2>
          <span className="text-xs text-slate-500">
            Showing last {recentSessions.length} sessions
          </span>
        </div>
        <div className="overflow-x-auto bg-base-100 shadow-md rounded-xl p-4">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Player</th>
                <th>Game</th>
                <th>Bet</th>
                <th>Result</th>
                <th>Status</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.tenantName}</td>
                  <td>{session.playerId}</td>
                  <td>{session.gameName}</td>
                  <td>${session.betAmount}</td>
                  <td
                    className={`font-semibold ${
                      session.resultAmount >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    ${session.resultAmount}
                  </td>
                  <td>
                    <span className={statusBadge(session.status)}>
                      {session.status}
                    </span>
                  </td>
                  <td>{session.startedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

