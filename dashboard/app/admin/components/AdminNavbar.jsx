"use client";

import useAdminTheme from "./useAdminTheme";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function AdminNavbar() {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <header className="bg-base-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <label htmlFor="admin-drawer" className="btn btn-square btn-ghost lg:hidden">
            <Bars3Icon className="h-5 w-5" />
          </label>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Admin Dashboard</p>
            <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="swap swap-rotate rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="swap-off">🌙 Dark</span>
            <span className="swap-on">☀️ Light</span>
          </button>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-center leading-8 text-sm font-semibold text-white">
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
