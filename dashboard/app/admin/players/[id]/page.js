"use client";

const playerSessions = [
  { game: "Lucky Ball", bet: 50, result: 25, started: "09:05", ended: "09:07", status: "won" },
  { game: "Rocket Reels", bet: 80, result: -40, started: "10:12", ended: "10:20", status: "lost" },
  { game: "Thunder Spins", bet: 30, result: 30, started: "11:11", ended: "11:13", status: "won" },
  { game: "Street Poker", bet: 60, result: -60, started: "12:33", ended: "12:45", status: "lost" },
  { game: "Crystal Cavern", bet: 45, result: 15, started: "13:22", ended: "13:36", status: "won" },
];

const playerCallbacks = [
  { id: "CB-201", delta: 120, ts: "07:45", status: "processed" },
  { id: "CB-202", delta: -50, ts: "08:15", status: "processed" },
  { id: "CB-203", delta: 75, ts: "09:12", status: "processed" },
  { id: "CB-204", delta: -30, ts: "10:01", status: "failed" },
  { id: "CB-205", delta: 0, ts: "10:55", status: "processed" },
];

const playerTransactions = [
  { id: "TX-301", amount: 200, type: "CREDIT", balance: 740.23, ts: "07:40" },
  { id: "TX-302", amount: -60, type: "DEBIT", balance: 680.23, ts: "08:00" },
  { id: "TX-303", amount: 150, type: "CREDIT", balance: 830.23, ts: "09:30" },
  { id: "TX-304", amount: -45, type: "DEBIT", balance: 785.23, ts: "10:05" },
  { id: "TX-305", amount: 100, type: "CREDIT", balance: 885.23, ts: "11:20" },
];

const badgeForStatus = (status) => {
  if (status === "active" || status === "won" || status === "processed") return "badge badge-success";
  if (status === "suspended" || status === "lost" || status === "failed") return "badge badge-error";
  return "badge badge-warning";
};

export default function PlayerDetailPage({ params }) {
  const { id } = params;
  const player = {
    id,
    name: "John Patel",
    tenant: "Blue Orion",
    balance: 540.23,
    createdAt: "2024-01-12",
    status: "active",
    sessions: 22,
    callbacks: 8,
  };

  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{player.name}</h1>
          <p className="text-base text-slate-600">Player ID: {id}</p>
        </div>
        <a href="/admin/players" className="btn btn-ghost btn-sm">
          ← Back to Players
        </a>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em]">Balance</div>
            <div className="stat-value text-3xl">₹{player.balance.toFixed(2)}</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em]">Total Sessions</div>
            <div className="stat-value text-3xl">{player.sessions}</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em]">Total Callbacks</div>
            <div className="stat-value text-3xl">{player.callbacks}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-base-100 shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Player Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Name</p>
            <p className="text-base font-semibold">{player.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tenant</p>
            <p className="text-base font-semibold">{player.tenant}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Balance</p>
            <p className="text-base font-semibold">₹{player.balance.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
            <span className={badgeForStatus(player.status)}>{player.status}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Created At</p>
            <p className="text-base font-semibold">{player.createdAt}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Sessions</h2>
          <span className="text-sm text-slate-500">Latest 5</span>
        </div>
        <div className="overflow-x-auto bg-base-100 p-4 shadow rounded-xl">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Game</th>
                <th>Bet</th>
                <th>Result</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {playerSessions.map((session) => (
                <tr key={session.player + session.game}>
                  <td>{session.game}</td>
                  <td>₹{session.bet}</td>
                  <td className={`font-semibold ${session.result >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ₹{session.result}
                  </td>
                  <td>{session.started}</td>
                  <td>{session.ended}</td>
                  <td>
                    <span className={badgeForStatus(session.status)}>{session.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Callbacks</h2>
          <span className="text-sm text-slate-500">Latest activities</span>
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
              {playerCallbacks.map((callback) => (
                <tr key={callback.id}>
                  <td>{callback.id}</td>
                  <td
                    className={`font-semibold ${
                      callback.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    ₹{callback.delta}
                  </td>
                  <td>{callback.ts}</td>
                  <td>
                    <span className={badgeForStatus(callback.status)}>{callback.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <span className="text-sm text-slate-500">Demo ledger</span>
        </div>
        <div className="overflow-x-auto bg-base-100 p-4 shadow rounded-xl">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {playerTransactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.id}</td>
                  <td
                    className={`font-semibold ${
                      txn.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    ₹{txn.amount}
                  </td>
                  <td>₹{txn.balance.toFixed(2)}</td>
                  <td>{txn.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
