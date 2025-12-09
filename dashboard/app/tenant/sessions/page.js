import { getTenantSessions, getTenantPlayerSessions } from "../../../src/lib/tenantApi";
import { useTenantProfile } from "../useTenantProfile";

export default async function TenantSessionsPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const playerFilter = params.playerId || "";
  const { profile, profileError } = useTenantProfile();
  let errorMessage = null;
  const payload = await (playerFilter ? getTenantPlayerSessions(playerFilter) : getTenantSessions())
    .catch((error) => {
      errorMessage = error.message || "Failed to fetch sessions.";
      return null;
    });
  const sessions = payload?.sessions || [];
  const metrics = profile?.metrics;
  const globalError = errorMessage || profileError;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant</p>
        <h1 className="text-3xl font-bold text-slate-900">Sessions</h1>
        <p className="text-sm text-slate-600">All active and closed sessions for your tenant.</p>
      </div>

      {globalError && (
        <div role="alert" className="alert alert-warning text-sm">
          {globalError}
        </div>
      )}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex-1 min-w-[250px]">
          <label className="label">
            <span className="label-text text-sm font-medium">Player filter (optional)</span>
          </label>
          <input
            name="playerId"
            defaultValue={playerFilter}
            placeholder="player-123"
            className="input input-bordered w-full"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            Apply Filter
          </button>
          {playerFilter && (
            <a href="/tenant/sessions" className="btn btn-ghost">
              Clear
            </a>
          )}
        </div>
      </form>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Sessions</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.totalSessions}</p>
          </div>
          <div className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active Sessions</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.activeSessions}</p>
          </div>
          <div className="card bg-base-100 shadow rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Distinct Players</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.distinctPlayers}</p>
          </div>
        </div>
      )}

{playerFilter && (
        <div className="alert alert-info text-xs">
          Showing sessions for <span className="font-semibold">{playerFilter}</span>.
        </div>
      )}

      <div className="overflow-x-auto bg-base-100 p-4 rounded-xl shadow">
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Player</th>
              <th>Game</th>
              <th>Bet</th>
              <th>Status</th>
              <th>Started</th>
              <th>Ended</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="font-mono text-xs">
                  <a className="link link-primary" href={/tenant/sessions/}>{session.id.slice(0, 8)}?</a>
                </td>
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
                <td>
                  {session.startedAt ? new Date(session.startedAt).toLocaleString() : "-"}
                </td>
                <td>{session.endedAt ? new Date(session.endedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {!sessions.length && (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-6">
                  No sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
