"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/tenant", label: "Overview" },
  { href: "/tenant/sessions", label: "Sessions" },
  { href: "/tenant/callbacks", label: "Callbacks" },
  { href: "/tenant/wallet", label: "Wallet" },
  { href: "/tenant/reports", label: "Reports" },
];

export default function TenantNav() {
  const pathname = usePathname();

  return (
    <nav className="p-4">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-xl px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
