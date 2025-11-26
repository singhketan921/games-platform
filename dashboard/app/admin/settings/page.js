"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [showReveal, setShowReveal] = useState(false);
  const [theme, setTheme] = useState("light");

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-base text-slate-600">
          Manage your admin account &amp; security settings
        </p>
      </div>

      <section className="card bg-base-100 shadow rounded-xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Profile</p>
            <h2 className="text-xl font-bold text-slate-900">System Administrator</h2>
            <p className="text-sm text-slate-500">admin@example.com</p>
            <div className="mt-2">
              <span className="badge badge-info mr-2">Super Admin</span>
              <span className="text-xs text-slate-500">Joined Jan 2024</span>
            </div>
          </div>
          <button className="btn btn-primary">Edit Profile</button>
        </div>
      </section>

      <section className="card bg-base-100 shadow rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">API Keys &amp; Security</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">API Key</p>
            <p className="text-base font-mono text-slate-500">
              ab12cd{showReveal ? "efghijklmnop" : "************"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-sm btn-outline" onClick={() => setShowReveal((prev) => !prev)}>
                {showReveal ? "Hide" : "Reveal"}
              </button>
              <button className="btn btn-sm">Copy</button>
              <button className="btn btn-sm btn-outline" onClick={() => alert("Demo only: key regenerated")}>
                Regenerate Key
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">API Secret</p>
            <p className="text-base font-mono text-slate-500">
              dk92jf{showReveal ? "mnopqrstu" : "************"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-sm btn-outline" onClick={() => setShowReveal((prev) => !prev)}>
                {showReveal ? "Hide" : "Reveal"}
              </button>
              <button className="btn btn-sm">Copy</button>
              <button className="btn btn-sm btn-outline" onClick={() => alert("Demo only: secret regenerated")}>
                Regenerate Secret
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Appearance</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">Theme:</span>
          <div className="swap swap-rotate">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            />
            <button className="swap-on btn btn-sm btn-outline">Dark</button>
            <button className="swap-off btn btn-sm btn-primary">Light</button>
          </div>
          <p className="text-sm text-slate-500">Current: {theme.charAt(0).toUpperCase() + theme.slice(1)}</p>
        </div>
      </section>

      <section className="card bg-base-100 shadow rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">System Info</h2>
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <tbody>
              <tr>
                <td className="font-semibold">Version</td>
                <td>v1.0.0</td>
              </tr>
              <tr>
                <td className="font-semibold">Environment</td>
                <td>Development</td>
              </tr>
              <tr>
                <td className="font-semibold">Uptime</td>
                <td>5 days 3 hours</td>
              </tr>
              <tr>
                <td className="font-semibold">Server Region</td>
                <td>EU-West</td>
              </tr>
              <tr>
                <td className="font-semibold">API Latency</td>
                <td>120 ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
