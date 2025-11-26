import {
  tenants,
  sessions,
  callbacks,
  transactions,
} from "./mockData";

const statCards = [
  { label: "Total Tenants", value: tenants.length },
  { label: "Total Games", value: 7 },
  { label: "Total Sessions", value: sessions.length },
  { label: "Total Callbacks", value: callbacks.length },
  {
    label: "Total Volume",
    value: `$${transactions
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
      .toLocaleString()}`,
  },
];

const formatDate = (value) => (value ? value : "—");

const statusBadge = (status) => {
  const mapping = {
    Won: "badge badge-success",
    Lost: "badge badge-error",
    "In Progress": "badge badge-info",
    Closed: "badge badge-ghost",
    Processed: "badge badge-success",
    Error: "badge badge-error",
    Pending: "badge badge-warning",
  };
  return mapping[status] || "badge badge-outline";
};

const recentSessions = [...sessions]
  .sort((a, b) => new Date(b.endedAt || Date.now()) - new Date(a.endedAt || Date.now()))
  .slice(0, 5)
  .map((session) => ({
    ...session,
    endedAt: session.endedAt || "In Progress",
  }));

const recentCallbacks = [...callbacks]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 5);

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="card bg-base-100 shadow-lg rounded-xl p-4">
            <div className="stat">
              <div className="stat-title text-xs uppercase tracking-[0.4em] text-slate-500">
                {card.label}
              </div>
              <div className="stat-value mt-2 text-3xl text-slate-900">{card.value}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="card bg-base-100 shadow-lg rounded-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Sessions</h2>
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Player</th>
                    <th>Game</th>
                    <th>Bet</th>
                    <th>Result</th>
                    <th>Status</th>
                    <th>Ended At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.tenantName}</td>
                      <td>{session.playerId}</td>
                      <td>{session.gameName}</td>
                      <td>${session.betAmount}</td>
                      <td>
                        <span
                          className={`font-semibold ${
                            session.resultAmount >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          ${session.resultAmount}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadge(session.status)}>{session.status}</span>
                      </td>
                      <td>{formatDate(session.endedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg rounded-xl">
          <div className="card-body">
            <h2 className="card-title">Activity</h2>
            <p className="text-sm text-slate-500 mb-4">
              Simulated engagement for the past 7 days.
            </p>
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2">
                {[6, 9, 5, 11, 8, 12, 7].map((height, index) => (
                  <div
                    key={index}
                    className="rounded-full bg-slate-200"
                    style={{ height: `${height * 5}px` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Real-time sessions
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="card bg-base-100 shadow-lg rounded-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Callbacks</h2>
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Session</th>
                    <th>Delta</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCallbacks.map((callback) => (
                    <tr key={callback.id}>
                      <td>{callback.tenantName}</td>
                      <td>{callback.sessionId}</td>
                      <td>
                        <span
                          className={`font-semibold ${
                            callback.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          ${callback.delta}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadge(callback.status)}>{callback.status}</span>
                      </td>
                      <td>{formatDate(callback.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-lg rounded-xl">
          <div className="card-body space-y-4">
            <h2 className="card-title">Quick Insights</h2>
            <p className="text-sm text-slate-500">
              Use this area for live alerts, maintenance reminders, or high-priority notes.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-outline">Sync Delay: 3m</span>
              <span className="badge badge-success">Backend healthy</span>
              <span className="badge badge-warning">Assignments pending</span>
              <span className="badge badge-info">No incidents</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
