import ErrorBox from "../components/ErrorBox";
import { getSessions, getCallbackHistory, getWalletBalance } from "../../src/lib/api";
import StatCard from "../components/Cards/StatCard";
import WalletCard from "../components/Cards/WalletCard";
import SessionsListCard from "../components/Cards/SessionsListCard";
import CallbackCard from "../components/Cards/CallbackCard";
import LastSessionsCard from "../components/Cards/LastSessionsCard";
import LaunchCard from "../components/Cards/LaunchCard";

const defaultPlayerId = process.env.NEXT_PUBLIC_DASHBOARD_DEFAULT_PLAYER_ID || "";

export default async function Page({ searchParams }) {
  const resolvedSearch = (await searchParams) ?? {};
  const requestedPlayerId = (resolvedSearch.playerId || "").trim();
  const playerId = requestedPlayerId || defaultPlayerId;

  let sessionData = [];
  let callbackData = [];
  let walletData = null;
  const errors = [];

  try {
    const payload = await getSessions();
    sessionData = payload?.sessions || [];
  } catch (err) {
    errors.push(err.message);
  }

  try {
    const payload = await getCallbackHistory();
    callbackData = payload?.callbacks || [];
  } catch (err) {
    errors.push(err.message);
  }

  if (playerId) {
    try {
      walletData = await getWalletBalance(playerId);
    } catch (err) {
      errors.push(err.message);
    }
  }

  const sessionsToShow = sessionData.slice(0, 5);
  const callbacksToShow = callbackData.slice(0, 5);

  const stats = [
    { label: "Total Sessions", value: sessionData.length, icon: "🎮" },
    { label: "Callbacks", value: callbackData.length, icon: "📡" },
    { label: "Wallet Balance", value: walletData ? `${walletData.balance} ${walletData.currency || ""}` : "-", icon: "💎" },
  ];

  return (
    <div className="space-y-8">
      {errors.length > 0 && <ErrorBox message={errors.join(" | ")} />}

      <header className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Live analytics and account overview</h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitor wallet health, sessions, callbacks, and launch events all in one place.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <WalletCard walletData={walletData} playerId={playerId} />
          <SessionsListCard sessions={sessionsToShow} />
          <CallbackCard callbacks={callbacksToShow} />
        </div>

        <div className="space-y-6">
          <LastSessionsCard sessions={sessionsToShow} />
          <LaunchCard />
        </div>
      </section>
    </div>
  );
}
