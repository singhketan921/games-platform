import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function LaunchCard() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-600 to-indigo-500 p-6 shadow-lg shadow-indigo-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Launch Game</p>
          <h3 className="text-2xl font-semibold text-white">Create a session</h3>
        </div>
        <SparklesIcon className="h-10 w-10 text-white/80" />
      </div>
      <p className="mt-3 text-sm text-indigo-100">
        Trigger the game launch API to start a new interactive session for any player.
      </p>
      <Link
        href="/dashboard/games"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-slate-50"
      >
        Launch Game
      </Link>
    </div>
  );
}
