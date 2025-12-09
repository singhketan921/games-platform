"use client";

import { useState, useTransition } from "react";

const PROFILES = ["HIGH", "MEDIUM", "LOW"];

export default function AssignmentRow({ assignment }) {
  const [rtpProfile, setRtpProfile] = useState(assignment.rtpProfile || "MEDIUM");
  const [isActive, setIsActive] = useState(assignment.isActive);
  const [message, setMessage] = useState(null);
  const [isPending, startTransition] = useTransition();

  const apiPath = `/api/admin/tenants/${assignment.tenantId}/games/${assignment.gameId}`;

  function handleUpdate(payload, updater) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error || "Failed to update assignment");
        return;
      }
      updater?.();
      setMessage("Saved");
    });
  }

  return (
    <tr>
      <td>
        <div className="font-semibold text-slate-800">{assignment.tenantName}</div>
        <div className="text-xs text-slate-500">{assignment.tenantId}</div>
      </td>
      <td>
        <div className="font-medium text-slate-800">{assignment.gameName}</div>
        <div className="text-xs text-slate-500">{assignment.gameId}</div>
      </td>
      <td>
        <select
          className="select select-bordered select-sm w-36"
          value={rtpProfile}
          disabled={isPending}
          onChange={(event) => {
            const next = event.target.value;
            handleUpdate(
              { rtpProfile: next },
              () => setRtpProfile(next)
            );
          }}
        >
          {PROFILES.map((profile) => (
            <option key={profile} value={profile}>
              {profile}
            </option>
          ))}
        </select>
      </td>
      <td>
        <span
          className={`badge ${isActive ? "badge-success" : "badge-ghost"} badge-sm`}
        >
          {isActive ? "Active" : "Disabled"}
        </span>
      </td>
      <td className="text-center">
        <button
          className={`btn btn-xs ${isActive ? "btn-warning" : "btn-success"}`}
          disabled={isPending}
          onClick={() => {
            handleUpdate(
              { isActive: !isActive },
              () => setIsActive((prev) => !prev)
            );
          }}
        >
          {isActive ? "Disable" : "Enable"}
        </button>
      </td>
      <td className="w-48 text-xs text-slate-500">
        {isPending ? "Saving..." : message}
      </td>
    </tr>
  );
}
