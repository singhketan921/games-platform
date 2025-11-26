"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoltIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const items = [
  { label: "Overview", href: "/dashboard", icon: SparklesIcon },
  { label: "Wallet History", href: "/dashboard/wallet", icon: CurrencyDollarIcon },
  { label: "Game Sessions", href: "/dashboard/sessions", icon: DocumentTextIcon },
  { label: "Callback Logs", href: "/dashboard/callbacks", icon: BoltIcon },
  { label: "Launch Game", href: "/dashboard/games", icon: PuzzlePieceIcon },
];

export default function Sidebar() {
  const pathname = usePathname() || "/dashboard";

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white py-8 px-6 md:flex">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">Tenant</p>
        <p className="text-2xl font-bold text-slate-900">Dashboard</p>
      </div>
      <nav className="space-y-2 text-sm font-medium text-slate-600">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2 transition ${
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
