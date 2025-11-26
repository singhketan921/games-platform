"use client";

import { BellIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";

export default function Navbar({ tenantName = "Demo Tenant" }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Tenant</p>
        <p className="text-lg font-semibold text-slate-900">{tenantName}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:text-slate-900"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:text-slate-900"
          aria-label="Settings"
        >
          <Cog8ToothIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">T</p>
            <p className="text-xs text-slate-500">Tenant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
