"use client";

import { useState } from "react";

export default function WalletActionForm({ kind, canMutate, defaultPlayer }) {
  const [playerId, setPlayerId] = useState(defaultPlayer || "");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!canMutate) return null;

  const endpoint = kind === "credit" ? "/api/tenant/wallet/credit" : "/api/tenant/wallet/debit";
  const title = kind === "credit" ? "Credit Wallet" : "Debit Wallet";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, amount: Number(amount), reference }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit");
      }
      setStatus({ type: "success", message: `${title} succeeded` });
      setAmount("");
      setReference("");
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Request failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow rounded-xl p-4">
      <h2 className="card-title text-sm font-semibold text-slate-700">{title}</h2>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="label"><span className="label-text text-sm font-medium">Player ID</span></label>
          <input
            className="input input-bordered w-full"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label"><span className="label-text text-sm font-medium">Amount</span></label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label"><span className="label-text text-sm font-medium">Reference (optional)</span></label>
          <input
            className="input input-bordered w-full"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="external-ref"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : title}
        </button>
        {status && (
          <div
            className={`alert text-xs ${
              status.type === "error" ? "alert-error" : "alert-success"
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
