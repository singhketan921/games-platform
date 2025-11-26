"use client";

import Link from "next/link";

const sessions = [
  {
    player: "P23089",
    game: "Rocket Reels",
    bet: 110,
    result: 0,
    started: "2024-02-16 07:10",
    ended: "2024-02-16 07:25",
    status: "in-progress",
  },
  {
    player: "P10999",
    game: "Thunder Spins",
    bet: 30,
    result: 30,
    started: "2024-02-16 07:30",
    ended: "2024-02-16 07:45",
    status: "won",
  },
  {
    player: "P40553",
    game: "Neon Derby",
    bet: 85,
    result: 0,
    started: "2024-02-15 16:15",
    ended: "2024-02-15 16:28",
    status: "closed",
  },
  {
    player: "P30010",
    game: "Lucky Ball",
    bet: 35,
    result: 70,
    started: "2024-02-15 13:18",
    ended: "2024-02-15 13:29",
    status: "won",
  },
  {
    player: "P55511",
    game: "Street Poker",
    bet: 60,
    result: -60,
    started: "2024-02-15 10:05",
    ended: "2024-02-15 10:15",
    status: "lost",
  },
];

const callbacks = [
  {
    id: "CB-101",
    delta: 120,
    game: "Teen Patti",
    ts: "2024-02-16 07:45",
    status: "processed",
  },
  {
    id: "CB-102",
    delta: -50,
    game: "Lucky Ball",
    ts: "2024-02-16 07:22",
    status: "processed",
  },
  {
    id: "CB-103",
    delta: 80,
    game: "Crystal Cavern",
    ts: "2024-02-15 19:14",
    status: "processed",
  },
  {
    id: "CB-104",
    delta: -30,
    game: "Thunder Spins",
    ts: "2024-02-15 12:48",
    status: "failed",
  },
  {
    id: "CB-105",
    delta: 0,
    game: "Rocket Reels",
    ts: "2024-02-15 10:07",
    status: "processed",
  },
];

const getBadgeClass = (status) => {
  switch (status) {
    case "won":
    case "processed":
      return "badge badge-success";
    case "lost":
    case "failed":
      return "badge badge-error";
    case "in-progress":
    case "closed":
      return "badge badge-warning";
    default:
      return "badge badge-outline";
  }
};

export default function TenantDetailPage({ params }) {
  const { id } = params;
  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Blue Orion</h1>
          <p className="text-base text-slate-600">Tenant ID: {id}</p>
        </div>
        <Link href="/admin/tenants" className="btn btn-ghost btn-sm">
          ← Back to Tenants
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-sm uppercase tracking-[0.3em]">Total Sessions</div>
            <div className="stat-value text-3xl">180</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-sm uppercase tracking-[0.3em]">Total Callbacks</div>
            <div className="stat-value text-3xl">52</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-sm uppercase tracking-[0.3em]">Total Revenue</div>
            <div className="stat-value text-3xl">$13,480</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-base-100 shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Tenant Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tenant Name</p>
            <p className="text-base font-semibold">Blue Orion</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Contact Email</p>
            <p className="text-base font-semibold">ops@blueorion.gg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Created At</p>
            <p className="text-base font-semibold">2023-11-03</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
            <span className="badge badge-success">Active</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recent Sessions</h2>
          <span className="text-sm text-slate-500">Showing latest activity</span>
        </div>
        <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Player</th>
                <th>Game</th>
                <th>Bet</th>
                <th>Result</th>
                <th>Started At</th>
                <th>Ended At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.player + session.game}>
                  <td>{session.player}</td>
                  <td>{session.game}</td>
                  <td>${session.bet}</td>
                  <td className={`font-semibold ${session.result >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ${session.result}
                  </td>
                  <td>{session.started}</td>
                  <td>{session.ended}</td>
                  <td>
                    <span className={getBadgeClass(session.status)}>{session.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recent Callbacks</h2>
          <span className="text-sm text-slate-500">Most recent log entries</span>
        </div>
        <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Callback ID</th>
                <th>Delta</th>
                <th>Game</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {callbacks.map((callback) => (
                <tr key={callback.id}>
                  <td>{callback.id}</td>
                  <td
                    className={`font-semibold ${
                      callback.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    ${callback.delta}
                  </td>
                  <td>{callback.game}</td>
                  <td>{callback.ts}</td>
                  <td>
                    <span className={getBadgeClass(callback.status)}>{callback.status}</span>
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
