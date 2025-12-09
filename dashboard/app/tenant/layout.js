import Link from "next/link";
import { cookies } from "next/headers";
import TenantNav from "./TenantNav";
import { getTenantProfile } from "../../src/lib/tenantApi";
import { TenantProfileContext } from "./profile-context";
import CurrencySelector from "./CurrencySelector";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default async function TenantLayout({ children }) {
  let profile = null;
  let profileError = null;

  try {
    profile = await getTenantProfile();
  } catch (error) {
    profileError = error.message || "Unable to load tenant profile.";
  }

  const cookieStore = cookies();
  const sessionRole = cookieStore.get("tenant-user-role")?.value || null;
  const preferredCurrency = cookieStore.get("tenant-preferred-currency")?.value || null;
  const userRole = profile?.user?.role || sessionRole;
  const hydratedProfile =
    profile && (profile.user?.role !== userRole)
      ? { ...profile, user: { ...(profile.user || {}), role: userRole } }
      : profile;
  const tenant = hydratedProfile?.tenant;
  const metrics = hydratedProfile?.metrics;
  const balances = hydratedProfile?.balances || [];

  return (
    <TenantProfileContext.Provider value={{ profile: hydratedProfile, profileError, preferredCurrency }}>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-6xl gap-6 py-10 px-6">
          <aside className="w-64 space-y-4 rounded-2xl bg-white shadow">
          <div className="border-b border-slate-100 p-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tenant</p>
            <p className="text-lg font-semibold text-slate-900">Control Panel</p>
            {tenant ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p className="text-base font-semibold text-slate-900">{tenant.name}</p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                  {tenant.status}
                </p>
                <p className="text-xs font-mono break-all text-slate-400">{tenant.id}</p>
                {tenant.domain && <p>{tenant.domain}</p>}
                {tenant.contactEmail && <p>{tenant.contactEmail}</p>}
              </div>
            ) : (
              <div className="alert alert-warning text-xs">
                {profileError || "Sign in again to view tenant details."}
              </div>
            )}
          </div>

          <TenantNav />

          {balances.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallets</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {balances.map((row) => (
                    <li key={row.currency} className="flex justify-between">
                      <span>{row.currency}</span>
                      <span className="font-semibold">{formatNumber(row.balance)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <CurrencySelector
                currencies={balances.map((row) => row.currency)}
                preferredCurrency={preferredCurrency}
              />
            </div>
          )}
        </aside>

          <main className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {tenant ? (
                  <p className="text-sm text-slate-500">
                    Signed in as <span className="font-semibold">{tenant.name}</span>
                    {userRole && (
                      <span className="ml-2 badge badge-sm badge-outline">
                        {userRole}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Tenant profile unavailable.</p>
                )}
              </div>
              <Link href="/tenant/logout" className="btn btn-ghost btn-sm">
                Logout
              </Link>
            </div>

            {metrics && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="card bg-base-100 shadow rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active Sessions</p>
                  <p className="text-2xl font-semibold text-slate-900">{metrics.activeSessions}</p>
                </div>
                <div className="card bg-base-100 shadow rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Sessions</p>
                  <p className="text-2xl font-semibold text-slate-900">{metrics.totalSessions}</p>
                </div>
                <div className="card bg-base-100 shadow rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Players</p>
                  <p className="text-2xl font-semibold text-slate-900">{metrics.distinctPlayers}</p>
                </div>
                <div className="card bg-base-100 shadow rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">GGR</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatNumber(metrics.grossGamingRevenue)}
                  </p>
                </div>
              </div>
            )}

            {profileError && (
              <div role="alert" className="alert alert-warning text-sm">
                {profileError}
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </TenantProfileContext.Provider>
  );
}
