import { getTenantCallbacks } from "../../../src/lib/tenantApi";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "processed", label: "Processed" },
  { value: "pending", label: "Pending" },
];

const statusBadgeClass = (status) =>
  status === "processed" ? "badge-success" : "badge-warning";

export default async function TenantCallbacksPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const statusFilter = params.status || "";

  let error = null;
  let payload = null;
  try {
    payload = await getTenantCallbacks();
  } catch (err) {
    error = err.message || "Failed to load callbacks.";
  }

  const callbacks = (payload?.callbacks || []).filter((cb) =>
    statusFilter ? cb.status === statusFilter : true
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant</p>
        <h1 className="text-3xl font-bold text-slate-900">Callbacks</h1>
        <p className="text-sm text-slate-600">
          Review closed sessions returned via wallet callbacks. Filter by status for quick triage.
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-warning text-sm">
          {error}
        </div>
      )}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[200px]">
          <label className="label">
            <span className="label-text text-sm font-medium">Status</span>
          </label>
          <select name="status" className="select select-bordered w-full" defaultValue={statusFilter}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          {statusFilter && (
            <a href="/tenant/callbacks" className="btn btn-ghost">
              Clear
            </a>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl bg-base-100 p-4 shadow">
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Session</th>
              <th>Player</th>
              <th>Game</th>
              <th>Status</th>
              <th>Closed At</th>
            </tr>
          </thead>
          <tbody>
            {callbacks.map((cb) => (
              <tr key={cb.id}>
                <td className="font-mono text-xs">
                  <a className="link link-primary" href={`/tenant/sessions/${cb.id}`}>
                    {cb.id.slice(0, 8)}
                  </a>
                </td>
                <td>{cb.playerId}</td>
                <td>{cb.gameId}</td>
                <td>
                  <span className={`badge badge-sm ${statusBadgeClass(cb.status)}`}>
                    {cb.status}
                  </span>
                </td>
                <td>{cb.endedAt ? new Date(cb.endedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {!callbacks.length && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  No callbacks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
