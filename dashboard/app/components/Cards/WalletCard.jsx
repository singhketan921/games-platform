import Link from "next/link";

export default function WalletCard({ walletData, playerId }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallet Balance</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Live Snapshot</h2>
        </div>
        <div className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase text-indigo-600">
          Updated now
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          $
        </div>
        <div>
          <p className="text-sm text-slate-500">Player</p>
          <p className="text-lg font-bold text-slate-900">{playerId || "No player selected"}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Balance</p>
          <p className="text-3xl font-bold text-slate-900">
            {walletData ? `${walletData.balance} ${walletData.currency || ""}` : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Updated</p>
          <p className="text-lg font-semibold text-indigo-600">Just now</p>
        </div>
      </div>

      <Link
        href="/dashboard/wallet"
        className="mt-6 inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
      >
        View Wallet History
      </Link>
    </div>
  );
}
