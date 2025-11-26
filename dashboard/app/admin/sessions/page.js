"use client";

import { useMemo, useState } from "react";

const sessions = [
  {
    id: "SS-101",
    tenant: "Blue Orion",
    player: "P-1901",
    game: "Teen Patti",
    bet: 50,
    result: -50,
    status: "lost",
    started: "2024-02-01 10:20",
    ended: "2024-02-01 10:22",
  },
  {
    id: "SS-102",
    tenant: "Fortune Grove",
    player: "P-2021",
    game: "Lucky Ball",
    bet: 20,
    result: 40,
    status: "won",
    started: "2024-02-02 08:10",
    ended: "2024-02-02 08:12",
  },
  {
    id: "SS-103",
    tenant: "Galaxy Runners",
    player: "P-3056",
    game: "Rocket Reels",
    bet: 60,
    result: 0,
    status: "in-progress",
    started: "2024-02-02 14:05",
    ended: "2024-02-02 14:10",
  },
  {
    id: "SS-104",
    tenant: "Blue Orion",
    player: "P-2021",
    game: "Crystal Cavern",
    bet: 45,
    result: 90,
    status: "won",
    started: "2024-02-03 13:35",
    ended: "2024-02-03 13:42",
  },
  {
    id: "SS-105",
    tenant: "Cosmic Luck",
    player: "P-1188",
    game: "Thunder Spins",
    bet: 30,
    result: -30,
    status: "lost",
    started: "2024-02-03 16:18",
    ended: "2024-02-03 16:22",
  },
  {
    id: "SS-106",
    tenant: "Eclipse Deck",
    player: "P-2215",
    game: "Street Poker",
    bet: 110,
    result: 220,
    status: "won",
    started: "2024-02-04 11:12",
    ended: "2024-02-04 11:25",
  },
];

const statusBadge = (status) => {
  switch (status) {
    case "won":
      return "badge badge-success";
    case "lost":
      return "badge badge-error";
    default:
      return "badge badge-warning";
  }
};

export default function SessionsPage() {
  const [tenantFilter, setTenantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return sessions
      .filter((session) => (tenantFilter ? session.tenant === tenantFilter : true))
      .filter((session) => (statusFilter === "All" ? true : session.status === statusFilter))
      .filter((session) =>
        query ? session.player.toLowerCase().includes(query.toLowerCase()) : true
      );
  }, [tenantFilter, statusFilter, query]);

  const tenants = Array.from(new Set(sessions.map((session) => session.tenant)));

  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Sessions</h1>
          <p className="text-base text-slate-600">Across all tenants</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="select select-bordered select-sm"
            value={tenantFilter}
            onChange={(event) => setTenantFilter(event.target.value)}
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant} value={tenant}>
                {tenant}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="in-progress">In Progress</option>
          </select>
          <input
            type="search"
            placeholder="Player ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input input-bordered input-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Tenant</th>
              <th>Player</th>
              <th>Game</th>
              <th>Bet</th>
              <th>Result</th>
              <th>Status</th>
              <th>Started</th>
              <th>Ended</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={session.id}>
                <td className="font-semibold">{session.id}</td>
                <td>{session.tenant}</td>
                <td>{session.player}</td>
                <td>{session.game}</td>
                <td>₹{session.bet}</td>
                <td
                  className={`font-semibold ${session.result >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  ₹{session.result}
                </td>
                <td>
                  <span className={statusBadge(session.status)}>{session.status}</span>
                </td>
                <td>{session.started}</td>
                <td>{session.ended}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
