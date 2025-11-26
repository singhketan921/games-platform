"use client";

import { useMemo } from "react";

const transactions = [
  { id: "TX-9001", tenant: "Fortune Grove", player: "P-2021", type: "CREDIT", amount: 40, balanceAfter: 340, createdAt: "2024-02-02 08:12" },
  { id: "TX-9002", tenant: "Blue Orion", player: "P-1901", type: "DEBIT", amount: -50, balanceAfter: 290, createdAt: "2024-02-01 10:22" },
  { id: "TX-9003", tenant: "Galaxy Runners", player: "P-3056", type: "CREDIT", amount: 60, balanceAfter: 350, createdAt: "2024-02-02 14:10" },
  { id: "TX-9004", tenant: "Blue Orion", player: "P-2021", type: "CREDIT", amount: 90, balanceAfter: 440, createdAt: "2024-02-03 13:42" },
  { id: "TX-9005", tenant: "Cosmic Luck", player: "P-1188", type: "DEBIT", amount: -30, balanceAfter: 410, createdAt: "2024-02-03 16:22" },
  { id: "TX-9006", tenant: "Eclipse Deck", player: "P-2215", type: "CREDIT", amount: 220, balanceAfter: 630, createdAt: "2024-02-04 11:25" },
];

const badgeClass = (type) => (type === "CREDIT" ? "badge badge-success" : "badge badge-error");

export default function TransactionsPage() {
  const totals = useMemo(() => {
    const credits = transactions
      .filter((txn) => txn.type === "CREDIT")
      .reduce((sum, txn) => sum + txn.amount, 0);
    const debits = transactions
      .filter((txn) => txn.type === "DEBIT")
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    return { credits, debits, net: credits - debits };
  }, []);

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
        <p className="text-base text-slate-600">Financial overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em] text-slate-500">Total Credits</div>
            <div className="stat-value text-2xl font-bold text-emerald-600">₹{totals.credits}</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em] text-slate-500">Total Debits</div>
            <div className="stat-value text-2xl font-bold text-rose-600">₹{totals.debits}</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100 shadow rounded-xl p-4">
          <div className="stat">
            <div className="stat-title text-xs uppercase tracking-[0.4em] text-slate-500">Net Volume</div>
            <div
              className={`stat-value text-2xl font-bold ${
                totals.net >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              ₹{totals.net}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Tenant</th>
              <th>Player</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Balance After</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td className="font-semibold">{txn.id}</td>
                <td>{txn.tenant}</td>
                <td>{txn.player}</td>
                <td className={`font-semibold ${txn.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                  ₹{txn.amount}
                </td>
                <td>
                  <span className={badgeClass(txn.type)}>{txn.type}</span>
                </td>
                <td>₹{txn.balanceAfter}</td>
                <td>{txn.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
