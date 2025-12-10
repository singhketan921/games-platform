import { getAdminWalletLogs, getAdminWalletLogMetrics } from "../../../../src/lib/api";
function formatCurrency(value) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const STATUS_COLORS = {
  SUCCESS: "badge-success",
  FAILURE: "badge-error",
  RETRY: "badge-warning",
};

const TYPE_COLORS = {
  DEBIT: "badge-primary",
  CREDIT: "badge-secondary",
  BALANCE: "badge-info",
};

export default async function AdminWalletLogsPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const filters = {
    tenantId: params.tenantId || "",
    status: params.status || "",
    type: params.type || "",
    hours: params.hours || "24",
    limit: params.limit || "100",
  };

  const [metricsPayload, logsPayload] = await Promise.all([
    getAdminWalletLogMetrics(filters.hours || undefined).catch(() => null),
    getAdminWalletLogs({
      tenantId: filters.tenantId || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
      hours: filters.hours || undefined,
      limit: filters.limit || undefined,
    }).catch(() => null),
  ]);

  const metrics = metricsPayload?.metrics;
  const logs = logsPayload?.logs || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Reports</p>
        <h1 className="text-3xl font-bold text-slate-900">Wallet Callbacks</h1>
        <p className="text-sm text-slate-600">
          Monitor wallet debit/credit callbacks, retries, and tenant-level failures.
        </p>
      </div>

      <form className="grid gap-4 rounded-xl bg-base-100 p-4 shadow md:grid-cols-5" method="get">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Tenant</label>
          <input name="tenantId" className="input input-bordered input-sm w-full" defaultValue={filters.tenantId} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
          <select name="status" className="select select-bordered select-sm w-full" defaultValue={filters.status}>
            <option value="">All</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="RETRY">Retry</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Type</label>
          <select name="type" className="select select-bordered select-sm w-full" defaultValue={filters.type}>
            <option value="">All</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
            <option value="BALANCE">Balance</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Hours Lookback</label>
          <input name="hours" type="number" className="input input-bordered input-sm w-full" defaultValue={filters.hours} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Limit</label>
          <input name="limit" type="number" className="input input-bordered input-sm w-full" defaultValue={filters.limit} />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn btn-primary btn-sm w-full">
            Apply Filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics?.statusCounts?.map((entry) => (
          <div key={entry.status} className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{entry.status}</p>
            <p className="text-2xl font-semibold text-slate-900">{entry.count}</p>
          </div>
        ))}
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Retries (&gt; 1)</p>
          <p className="text-2xl font-semibold text-slate-900">{metrics?.retryCount ?? 0}</p>
        </div>
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Top Failing Tenants</p>
          <ul className="text-sm text-slate-700 space-y-1">
            {metrics?.topTenants?.length
              ? metrics.topTenants.map((tenant) => (
                  <li key={tenant.tenantId} className="flex justify-between">
                    <span>{tenant.tenantId}</span>
                    <span>{tenant.count}</span>
                  </li>
                ))
              : <li>None recorded.</li>}
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-sm font-semibold text-slate-700">Recent Callbacks</h2>
          <span className="text-xs text-slate-500">Showing {logs.length} rows</span>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>Time</th>
                <th>Tenant</th>
                <th>Type</th>
                <th>Status</th>
                <th>Endpoint</th>
                <th>Attempt</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
                  <td>{log.tenantId}</td>
                  <td>
                    <span className={`badge badge-sm ${TYPE_COLORS[log.type] || "badge-outline"}`}>
                      {log.type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${STATUS_COLORS[log.status] || "badge-outline"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="font-mono text-[11px]">{log.endpoint}</td>
                  <td>{log.attempt}</td>
                  <td>
                    {log.responseCode || "-"}
                    {log.errorMessage ? ` - ${log.errorMessage}` : ""}
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-6">
                    No wallet logs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

