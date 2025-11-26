"use client";

const gameDescription = {
  g1: {
    name: "Teen Patti",
    description: "Popular Indian betting card game.",
    status: "active",
    sessions: 120,
    callbacks: 50,
    volatility: "Medium",
    rtp: 96.4,
  },
  g2: {
    name: "Lucky Ball",
    description: "Fast-paced lottery experiences.",
    status: "active",
    sessions: 95,
    callbacks: 30,
    volatility: "High",
    rtp: 95.3,
  },
  g3: {
    name: "Rocket Reels",
    description: "Space-themed slot machine.",
    status: "inactive",
    sessions: 0,
    callbacks: 0,
    volatility: "Low",
    rtp: 94.7,
  },
};

const recentSessions = [
  { player: "P23089", bet: 110, result: 0, started: "07:10", ended: "07:25", status: "in-progress" },
  { player: "P10999", bet: 30, result: 30, started: "07:30", ended: "07:45", status: "won" },
  { player: "P40553", bet: 85, result: 0, started: "16:15", ended: "16:28", status: "closed" },
  { player: "P30010", bet: 35, result: 70, started: "13:18", ended: "13:29", status: "won" },
  { player: "P55511", bet: 60, result: -60, started: "10:05", ended: "10:15", status: "lost" },
];

const recentCallbacks = [
  { id: "CB-101", delta: 120, ts: "07:45", status: "processed" },
  { id: "CB-102", delta: -50, ts: "07:22", status: "processed" },
  { id: "CB-103", delta: 80, ts: "19:14", status: "processed" },
  { id: "CB-104", delta: -30, ts: "12:48", status: "failed" },
  { id: "CB-105", delta: 0, ts: "10:07", status: "processed" },
];

const badgeClass = (status) => {
  if (status === "active" || status === "processed" || status === "won") return "badge badge-success";
  if (status === "inactive" || status === "failed" || status === "lost") return "badge badge-error";
  return "badge badge-warning";
};

export default function GameDetailPage({ params }) {
  const { id } = params;
  const game = gameDescription[id] || gameDescription.g1;

  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{game.name}</h1>
          <p className="text-sm text-slate-500">Game ID: {id}</p>
        </div>
        <button className="btn btn-ghost btn-sm">← Back to Games</button>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em]">Status</div>
            <div className="stat-value text-2xl">
              <span className={badgeClass(game.status)}>{game.status}</span>
            </div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em]">Total Sessions</div>
            <div className="stat-value text-2xl">{game.sessions}</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em]">Total Callbacks</div>
            <div className="stat-value text-2xl">{game.callbacks}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-base-100 shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Game Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Description</p>
            <p>{game.description}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">RTP</p>
            <p className="font-semibold">{game.rtp}%</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-2">Volatility</p>
            <p className="font-semibold">{game.volatility}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Sessions</h2>
          <span className="text-sm text-slate-500">Showing 5 rows</span>
        </div>
        <div className="overflow-x-auto bg-base-100 p-4 shadow rounded-xl">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Player</th>
                <th>Bet</th>
                <th>Result</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => (
                <tr key={session.player + session.game}>
                  <td>{session.player}</td>
                  <td>${session.bet}</td>
                  <td className={`font-semibold ${session.result >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ${session.result}
                  </td>
                  <td>{session.started}</td>
                  <td>{session.ended}</td>
                  <td>
                    <span className={badgeClass(session.status)}>{session.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Callbacks</h2>
          <span className="text-sm text-slate-500">Latest 5</span>
        </div>
        <div className="overflow-x-auto bg-base-100 p-4 shadow rounded-xl">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Callback ID</th>
                <th>Delta</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCallbacks.map((callback) => (
                <tr key={callback.id}>
                  <td>{callback.id}</td>
                  <td
                    className={`font-semibold ${
                      callback.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    ${callback.delta}
                  </td>
                  <td>{callback.ts}</td>
                  <td>
                    <span className={badgeClass(callback.status)}>{callback.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
