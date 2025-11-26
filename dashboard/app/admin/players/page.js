"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const players = [
  { id: "P-1001", name: "John Patel", tenant: "Blue Orion", sessions: 22, balance: 540.23 },
  { id: "P-1002", name: "Ayesha Khan", tenant: "Fortune Grove", sessions: 10, balance: 230.0 },
  { id: "P-1003", name: "Mohit Rao", tenant: "Galaxy Runners", sessions: 5, balance: 90.5 },
  { id: "P-1004", name: "Nikki Shah", tenant: "Eclipse Deck", sessions: 14, balance: 810.0 },
  { id: "P-1005", name: "Ravi Kumar", tenant: "Cosmic Luck", sessions: 6, balance: 310.75 },
];

export default function PlayersPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return players;
    return players.filter(
      (player) =>
        player.name.toLowerCase().includes(term) ||
        player.id.toLowerCase().includes(term) ||
        player.tenant.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Players</h1>
          <p className="text-base text-slate-600">All players across all tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search players"
            className="input input-bordered input-sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="text-sm text-slate-500">⌕</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Player ID</th>
              <th>Name</th>
              <th>Tenant</th>
              <th>Sessions</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <tr key={player.id}>
                <td className="font-semibold">{player.id}</td>
                <td>{player.name}</td>
                <td>{player.tenant}</td>
                <td>{player.sessions}</td>
                <td>₹{player.balance.toFixed(2)}</td>
                <td>
                  <Link href={`/admin/players/${player.id}`} className="btn btn-sm btn-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
