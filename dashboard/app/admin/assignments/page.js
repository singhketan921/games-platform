"use client";

import { useState } from "react";
import { tenants, games, assignments } from "../mockData";

const statusBadge = (isActive) =>
  isActive ? "badge badge-success" : "badge badge-error";

export default function AssignmentsPage() {
  const [tenantFilter, setTenantFilter] = useState("");
  const [gameFilter, setGameFilter] = useState("");

  const handleAssign = () => {
    const tenantName = tenantFilter || "Any tenant";
    const gameName = gameFilter || "Any game";
    alert(`Demo only: assign ${gameName} to ${tenantName}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Operations</p>
        <h1 className="text-3xl font-semibold text-slate-900">Assign Games</h1>
      </div>

      <div className="card bg-base-100 shadow-lg rounded-xl border border-slate-100 p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <select
            className="select select-bordered w-full"
            value={tenantFilter}
            onChange={(event) => setTenantFilter(event.target.value)}
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.name}>
                {tenant.name}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered w-full"
            value={gameFilter}
            onChange={(event) => setGameFilter(event.target.value)}
          >
            <option value="">All Games</option>
            {games.map((game) => (
              <option key={game.id} value={game.name}>
                {game.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleAssign}>
            Assign
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg rounded-xl border border-slate-100">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Existing Assignments</h2>
            <p className="text-sm text-slate-500">Toggle status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Game</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.tenantName}</td>
                    <td>{assignment.gameName}</td>
                    <td>
                      <span className={statusBadge(assignment.isActive)}>
                        {assignment.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="flex items-center justify-center">
                      <button
                        className={`btn btn-xs ${
                          assignment.isActive ? "btn-warning" : "btn-success"
                        }`}
                        onClick={() =>
                          alert(
                            `Demo only: ${
                              assignment.isActive ? "disable" : "enable"
                            } ${assignment.gameName} for ${assignment.tenantName}`
                          )
                        }
                      >
                        {assignment.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
