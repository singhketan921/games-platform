export default function LastSessionsCard({ sessions = [] }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Last 5 Sessions</p>
        <p className="text-sm font-semibold text-slate-500">Compact view</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sessions.length ? (
          sessions.map((session, index) => (
            <div
              key={session.id ?? index}
              className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600"
            >
              <p className="text-sm font-semibold text-slate-900">{session.id?.slice(0, 6) || "—"}</p>
              <p>{session.gameId || "Unknown game"}</p>
              <p className="font-semibold text-indigo-600">{session.result || "pending"}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No sessions yet.</p>
        )}
      </div>
    </div>
  );
}
