"use client";

import { SunIcon, MoonIcon, Bars3Icon } from "@heroicons/react/24/outline";
import useAdminTheme from "./useAdminTheme";

export default function AdminNavbar() {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <header className="sticky top-0 z-20 bg-base-100 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-square lg:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Admin Dashboard</p>
            <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
          >
            {theme === "corporate" ? (
              <>
                <MoonIcon className="h-4 w-4 text-slate-500" />
                Dark
              </>
            ) : (
              <>
                <SunIcon className="h-4 w-4 text-amber-400" />
                Light
              </>
            )}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-semibold text-white">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Admin</p>
              <p className="text-xs text-slate-500">Superuser</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

