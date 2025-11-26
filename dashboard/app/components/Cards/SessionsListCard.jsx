import Link from "next/link";

export default function SessionsListCard({ sessions = [] }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Recent Sessions</p>
          <h3 className="text-xl font-semibold text-slate-900">Last Activity</h3>
        </div>
        <Link href="/dashboard/sessions" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          View all ⇢
        </Link>
      </div>

      <ul className="mt-6 space-y-4">
        {sessions.length ? (
          sessions.map((session) => (
            <li key={session.id} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{session.gameId || "Unknown Game"}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    session.result === "win" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {session.result || "pending"}
                </span>
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{session.id}</p>
              <p className="text-sm text-slate-600">
                {session.startedAt ? new Date(session.startedAt).toLocaleString() : "N/A"}
              </p>
            </li>
          ))
        ) : (
          <p className="text-sm text-slate-500">No sessions available.</p>
        )}
      </ul>
    </div>
  );
}
