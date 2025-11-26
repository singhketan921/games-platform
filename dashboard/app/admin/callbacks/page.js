"use client";

import { useMemo, useState } from "react";

const callbacks = [
  { id: "CB-5001", tenant: "Blue Orion", sessionId: "SS-101", delta: -50, status: "processed", createdAt: "2024-02-01 10:22" },
  { id: "CB-5002", tenant: "Fortune Grove", sessionId: "SS-102", delta: 40, status: "processed", createdAt: "2024-02-02 08:12" },
  { id: "CB-5003", tenant: "Galaxy Runners", sessionId: "SS-103", delta: 0, status: "pending", createdAt: "2024-02-02 14:12" },
  { id: "CB-5004", tenant: "Blue Orion", sessionId: "SS-104", delta: 90, status: "processed", createdAt: "2024-02-03 13:42" },
  { id: "CB-5005", tenant: "Cosmic Luck", sessionId: "SS-105", delta: -30, status: "failed", createdAt: "2024-02-03 16:22" },
  { id: "CB-5006", tenant: "Eclipse Deck", sessionId: "SS-106", delta: 220, status: "processed", createdAt: "2024-02-04 11:25" },
];

const statusClass = (status) => {
  if (status === "processed") return "badge badge-success";
  if (status === "failed") return "badge badge-error";
  return "badge badge-warning";
};

export default function CallbacksPage() {
  const [tenantFilter, setTenantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return callbacks
      .filter((callback) => (tenantFilter ? callback.tenant === tenantFilter : true))
      .filter((callback) => (statusFilter === "All" ? true : callback.status === statusFilter));
  }, [tenantFilter, statusFilter]);

  const tenants = Array.from(new Set(callbacks.map((callback) => callback.tenant)));

  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Callback Logs</h1>
          <p className="text-base text-slate-600">Track callback outcomes across all tenants</p>
        </div>
        <div className="flex gap-2">
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
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Callback ID</th>
              <th>Tenant</th>
              <th>Session ID</th>
              <th>Delta</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((callback) => (
              <tr key={callback.id}>
                <td className="font-semibold">{callback.id}</td>
                <td>{callback.tenant}</td>
                <td>{callback.sessionId}</td>
                <td
                  className={`font-semibold ${callback.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  ₹{callback.delta}
                </td>
                <td>
                  <span className={statusClass(callback.status)}>{callback.status}</span>
                </td>
                <td>{callback.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
