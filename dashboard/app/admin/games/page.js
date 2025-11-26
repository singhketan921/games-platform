"use client";

import Link from "next/link";

const games = [
  { id: "g1", name: "Teen Patti", status: "active", sessions: 120, callbacks: 50 },
  { id: "g2", name: "Lucky Ball", status: "active", sessions: 95, callbacks: 30 },
  { id: "g3", name: "Rocket Reels", status: "inactive", sessions: 0, callbacks: 0 },
  { id: "g4", name: "Crystal Cavern", status: "active", sessions: 82, callbacks: 18 },
];

const badgeClass = (status) =>
  status === "active" ? "badge badge-success" : "badge badge-error";

export default function GamesListPage() {
  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Game Management</p>
          <h1 className="text-3xl font-bold text-slate-900">Games</h1>
        </div>
        <Link href="/admin/games/create" className="btn btn-primary">
          Add New Game
        </Link>
      </div>

      <div className="overflow-x-auto bg-base-100 p-4 shadow rounded-xl">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Total Sessions</th>
              <th>Total Callbacks</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td className="font-semibold text-slate-900">{game.name}</td>
                <td>
                  <span className={badgeClass(game.status)}>{game.status}</span>
                </td>
                <td>{game.sessions}</td>
                <td>{game.callbacks}</td>
                <td className="flex flex-wrap items-center justify-center gap-2">
                  <Link href={`/admin/games/${game.id}`} className="btn btn-xs btn-ghost">
                    View
                  </Link>
                  <Link href={`/admin/games/${game.id}`} className="btn btn-xs btn-outline">
                    Edit
                  </Link>
                  <button className="btn btn-xs btn-warning">Toggle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
