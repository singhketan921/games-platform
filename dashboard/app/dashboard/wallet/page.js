import Link from "next/link";
import Table from "../../components/Tables/Table";
import ErrorBox from "../../components/ErrorBox";
import { getWalletHistory } from "../../../src/lib/api";

const columns = [
  { header: "Transaction", accessor: "id" },
  { header: "Type", accessor: "type" },
  { header: "Amount", accessor: "amount" },
  { header: "Reference", accessor: "reference" },
  {
    header: "Created At",
    accessor: "createdAt",
    render: (value) => (value ? new Date(value).toLocaleString() : "-"),
  },
];

export default async function WalletPage({ searchParams } = {}) {
  const playerId = searchParams?.playerId?.toString?.().trim?.() || "";
  let transactions = [];
  let error = "";

  if (playerId) {
    try {
      const payload = await getWalletHistory(playerId);
      transactions = payload?.transactions || [];
    } catch (err) {
      error = err.message;
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form id="wallet-search" className="flex flex-col gap-3 md:flex-row md:items-end" method="get">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
              Player ID
            </label>
            <input
              name="playerId"
              defaultValue={playerId}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Enter player id"
            />
          </div>
          <button
            type="submit"
            className="whitespace-nowrap rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            Load Wallet History
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Each request is authenticated using your HMAC credentials. Provide a player ID above to pull
          the latest wallet history.
        </p>
      </section>

      {error && <ErrorBox message={error} />}

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Wallet History</p>
            <h2 className="text-xl font-semibold text-slate-900">
              {playerId ? `Player ${playerId}` : "Enter Player ID to view wallet history"}
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Back to overview
          </Link>
        </div>

        {playerId ? (
          <div className="mt-6">
            <Table columns={columns} data={transactions} />
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Enter a player ID and submit the form to display wallet transactions securely fetched
            from the API.
          </div>
        )}
      </section>
    </div>
  );
}
