"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CurrencySelector({ currencies = [], preferredCurrency }) {
  const unique = Array.from(new Set(currencies.filter(Boolean)));
  if (unique.length <= 1) {
    return null;
  }

  const router = useRouter();
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const value = preferredCurrency && unique.includes(preferredCurrency) ? preferredCurrency : unique[0];

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  function handleChange(event) {
    const selected = event.target.value;
    startTransition(async () => {
      setStatus("Saving...");
      try {
        const response = await fetch("/api/tenant/currency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: selected }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus(data?.error || "Failed to save");
          return;
        }
        setStatus("Saved");
        router.refresh();
      } catch (err) {
        setStatus(err.message || "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Preferred currency</label>
      <select
        className="select select-bordered select-sm w-full"
        defaultValue={value}
        disabled={isPending}
        onChange={handleChange}
      >
        {unique.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
      {status && <p className="text-[11px] text-slate-500">{status}</p>}
    </div>
  );
}
