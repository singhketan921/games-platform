import { getTenantSessions, getTenantCallbacks } from "../../src/lib/tenantApi";
import { useTenantProfile } from "./useTenantProfile";

export default async function TenantDashboard() {
  const { profile, profileError } = useTenantProfile();
  let sessionsError = null;
  let callbacksError = null;

  const [sessionsPayload, callbacksPayload] = await Promise.all([
    getTenantSessions().catch((error) => {
      sessionsError = error.message || "Failed to load sessions.";
      return null;
    }),
    getTenantCallbacks().catch((error) => {
      callbacksError = error.message || "Failed to load callbacks.";
      return null;
    }),
  ]);

  const sessions = sessionsPayload?.sessions || [];
  const callbacks = callbacksPayload?.callbacks || [];
  const metrics = profile?.metrics;
  const assignedGames = profile?.games || [];
  const walletBalances = profile?.balances || [];
  const globalError = sessionsError || callbacksError || profileError;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant Dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-600">
          Snapshot of your sessions, callbacks, and wallet events.
        </p>
      </div>

      {globalError && (
        <div role="alert" className="alert alert-warning text-sm">
          {globalError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active Sessions</p>
          <p className="text-2xl font-semibold text-slate-900">
            {metrics?.activeSessions ?? sessions.filter((s) => !s.isClosed).length}
          </p>
        </div>
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Sessions</p>
          <p className="text-2xl font-semibold text-slate-900">
            {metrics?.totalSessions ?? sessions.length}
          </p>
        </div>
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Callbacks (24h)</p>
          <p className="text-2xl font-semibold text-slate-900">{callbacks.length}</p>
        </div>
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Open Issues</p>
          <p className="text-2xl font-semibold text-slate-900">
            {callbacks.filter((cb) => cb.status !== "processed").length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Recent Sessions</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Game</th>
                  <th>Bet</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 5).map((session) => (
                  <tr key={session.id}>
                    <td>{session.playerId}</td>
                    <td>{session.gameId}</td>
                    <td>{session.betAmount}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          session.isClosed ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {session.isClosed ? "Closed" : "Open"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!sessions.length && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-4">
                      No session data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Recent Callbacks</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Delta</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {callbacks.slice(0, 5).map((cb) => (
                  <tr key={cb.id}>
                    <td>{cb.id}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          cb.status === "processed" ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {cb.status}
                      </span>
                    </td>
                    <td>{cb.delta}</td>
                    <td>{cb.createdAt ? new Date(cb.createdAt).toLocaleTimeString() : "-"}</td>
                  </tr>
                ))}
                {!callbacks.length && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-4">
                      No callbacks yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Assigned Games</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Status</th>
                  <th>RTP Profile</th>
                </tr>
              </thead>
              <tbody>
                {assignedGames.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.name}</td>
                    <td>{assignment.status}</td>
                    <td>{assignment.rtpProfile}</td>
                  </tr>
                ))}
                {!assignedGames.length && (
                  <tr>
                    <td colSpan={3} className="text-center text-slate-500 py-4">
                      No games assigned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card bg-base-100 shadow rounded-xl p-4">
          <h2 className="card-title text-sm font-semibold text-slate-700">Wallet Balances</h2>
          <div className="mt-4 space-y-2">
            {walletBalances.map((balance) => (
              <div
                key={balance.currency}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm"
              >
                <span className="font-medium text-slate-600">{balance.currency}</span>
                <span className="font-semibold text-slate-900">
                  {Number(balance.balance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            {!walletBalances.length && (
              <p className="text-center text-slate-500 text-sm">No wallet data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
