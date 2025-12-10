import AssignmentRow from "./AssignmentRow";
import { getAdminGames, getAdminTenants } from "../../../src/lib/api";

export const dynamic = "force-dynamic";

function buildAssignments(tenants) {
  const records = Array.isArray(tenants) ? tenants : tenants?.tenants || [];
  return records.flatMap((tenant) =>
    (tenant.gameAssignments || []).map((assignment) => ({
      id: `${tenant.id}-${assignment.gameId}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      gameId: assignment.gameId,
      gameName: assignment.name || assignment.gameId,
      isActive: assignment.isActive,
      rtpProfile: assignment.rtpProfile,
    }))
  );
}

export default async function AdminAssignmentsPage({ searchParams }) {
  const params = searchParams || {};
  const [tenantPayload, gamePayload] = await Promise.all([getAdminTenants(), getAdminGames()]);
  const tenants = tenantPayload?.tenants || [];
  const games = gamePayload?.games || [];

  const allAssignments = buildAssignments(tenants);
  const tenantFilter = (params.tenantId || "").toLowerCase();
  const gameFilter = (params.gameId || "").toLowerCase();
  const filteredAssignments = allAssignments.filter((assignment) => {
    const tenantMatch = tenantFilter
      ? assignment.tenantId.toLowerCase().includes(tenantFilter) ||
        assignment.tenantName.toLowerCase().includes(tenantFilter)
      : true;
    const gameMatch = gameFilter
      ? assignment.gameId.toLowerCase().includes(gameFilter) ||
        assignment.gameName.toLowerCase().includes(gameFilter)
      : true;
    return tenantMatch && gameMatch;
  });

  const tenantOptions = tenants.map((tenant) => ({
    label: tenant.name,
    value: tenant.id,
  }));
  const gameOptions = games.map((game) => ({
    label: game.name,
    value: game.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Operations</p>
        <h1 className="text-3xl font-semibold text-slate-900">Game Assignments</h1>
        <p className="text-sm text-slate-600">
          Enable/disable tenant games and override RTP profiles per assignment. Updates call the
          `/admin/tenants/:tenantId/games/:gameId` API behind the scenes.
        </p>
      </div>

      <form className="card bg-base-100 shadow rounded-xl border border-slate-100 p-4 grid gap-4 md:grid-cols-3" method="GET">
        <label className="form-control">
          <span className="label-text text-xs uppercase tracking-[0.3em] text-slate-500">
            Tenant
          </span>
          <select className="select select-bordered select-sm" name="tenantId" defaultValue={params.tenantId || ""}>
            <option value="">All tenants</option>
            {tenantOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text text-xs uppercase tracking-[0.3em] text-slate-500">
            Game
          </span>
          <select className="select select-bordered select-sm" name="gameId" defaultValue={params.gameId || ""}>
            <option value="">All games</option>
            {gameOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-primary btn-sm w-full">
            Apply filters
          </button>
          <a href="/admin/assignments" className="btn btn-ghost btn-sm">
            Reset
          </a>
        </div>
      </form>

      <div className="card bg-base-100 shadow rounded-2xl border border-slate-100">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-sm font-semibold text-slate-700">Assignments</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredAssignments.length} of {allAssignments.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-compact text-xs">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Game</th>
                  <th>RTP Profile</th>
                  <th>Status</th>
                  <th className="text-center">Toggle</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length ? (
                  filteredAssignments.map((assignment) => (
                    <AssignmentRow key={assignment.id} assignment={assignment} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      No assignments match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
