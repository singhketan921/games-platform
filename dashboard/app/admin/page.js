import { revalidatePath } from "next/cache";
import {
  getAdminMetrics,
  getGlobalRtpConfig,
  updateGlobalRtpConfig,
  getRtpChangeLogs,
} from "../../src/lib/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

async function updateGlobalRtp(formData) {
  "use server";

  const profile = formData.get("profile")?.toString().toUpperCase();
  if (!profile) {
    throw new Error("RTP profile is required");
  }

  await updateGlobalRtpConfig(profile);
  revalidatePath("/admin");
}

export default async function AdminDashboardPage() {
  const [metrics, globalConfig, rtpLogs] = await Promise.all([
    getAdminMetrics(),
    getGlobalRtpConfig(),
    getRtpChangeLogs(20),
  ]);

  const summary = metrics?.summary || {};
  const rtpTrend = metrics?.rtpTrend || [];
  const walletFailures = metrics?.walletFailures || [];
  const globalRtp = globalConfig?.config?.profile || "MEDIUM";

  const statCards = [
    { label: "Tenants", value: summary.tenants || 0 },
    { label: "Games", value: summary.games || 0 },
    { label: "Sessions (24h)", value: summary.sessions24h || 0 },
    { label: "Revenue (24h)", value: formatCurrency(summary.revenue24h || 0) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Operations Control</p>
        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-sm text-slate-600">Live snapshot of usage, RTP trends, and wallet issues.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="card-title text-sm font-semibold text-slate-700">Global RTP Profile</h2>
            <p className="text-xs text-slate-500">
              Default RTP applied to new tenant games unless overridden.
            </p>
          </div>
          <form action={updateGlobalRtp} className="flex items-center gap-2">
            <select
              name="profile"
              defaultValue={globalRtp}
              className="select select-bordered select-sm"
            >
              <option value="HIGH">High (97%)</option>
              <option value="MEDIUM">Medium (95%)</option>
              <option value="LOW">Low (90%)</option>
            </select>
            <button type="submit" className="btn btn-sm btn-primary">
              Update
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">RTP Trend (Last 7 Days)</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>RTP</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {rtpTrend.map((entry) => (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{(entry.rtp * 100).toFixed(1)}%</td>
                    <td>{(entry.target * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                {rtpTrend.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-slate-500 py-4">
                      No RTP data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Wallet Failures</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {walletFailures.map((failure) => (
                  <tr key={failure.id}>
                    <td>{failure.tenantId}</td>
                    <td>{failure.type}</td>
                    <td>
                      <span className="badge badge-error badge-sm">{failure.status}</span>
                    </td>
                    <td>{new Date(failure.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {walletFailures.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-4">
                      No failures recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow rounded-xl p-4">
        <h2 className="card-title text-sm font-semibold text-slate-700">RTP Change Log</h2>
        <div className="overflow-x-auto mt-4">
          <table className="table table-compact text-xs">
            <thead>
              <tr>
                <th>Time</th>
                <th>Target</th>
                <th>Previous</th>
                <th>New</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {rtpLogs?.logs?.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    {log.tenantId
                      ? `${log.tenantId}${log.tenantGameId ? `:${log.tenantGameId}` : ""}`
                      : "Global"}
                  </td>
                  <td>{log.previousProfile || "-"}</td>
                  <td className="font-semibold">{log.newProfile}</td>
                  <td>{log.actor || "system"}</td>
                </tr>
              ))}
              {!rtpLogs?.logs?.length && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-4">
                    No RTP changes recorded yet.
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
