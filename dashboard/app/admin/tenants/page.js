"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const tenants = [
  { id: "T-001", name: "Blue Orion", games: 12, sessions: 180, revenue: 3400, status: "active" },
  { id: "T-002", name: "Fortune Grove", games: 7, sessions: 90, revenue: 1200, status: "suspended" },
  { id: "T-003", name: "Galaxy Runners", games: 9, sessions: 150, revenue: 2750, status: "active" },
  { id: "T-004", name: "Eclipse Deck", games: 14, sessions: 220, revenue: 4800, status: "active" },
  { id: "T-005", name: "Cosmic Luck", games: 5, sessions: 60, revenue: 900, status: "suspended" },
];

export default function TenantsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter((tenant) => tenant.name.toLowerCase().includes(term));
  }, [query]);

  const badgeClass = (status) =>
    status === "active" ? "badge badge-success" : "badge badge-error";

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Tenant Operations</p>
          <h1 className="text-3xl font-bold text-slate-900">Tenants</h1>
          <p className="text-base text-slate-600">Manage all tenant accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search tenants"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input input-bordered input-sm"
          />
          <span className="text-sm text-slate-500">⌕</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Games</th>
              <th>Sessions</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tenant) => (
              <tr key={tenant.id}>
                <td className="font-semibold text-slate-900">{tenant.name}</td>
                <td>{tenant.games}</td>
                <td>{tenant.sessions}</td>
                <td>${tenant.revenue.toLocaleString()}</td>
                <td>
                  <span className={badgeClass(tenant.status)}>{tenant.status}</span>
                </td>
                <td>
                  <Link href={`/admin/tenants/${tenant.id}`}>
                    <button className="btn btn-sm btn-primary">View</button>
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
