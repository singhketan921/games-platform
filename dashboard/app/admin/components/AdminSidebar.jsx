"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  UserGroupIcon,
  PlusCircleIcon,
  PuzzlePieceIcon,
  ListBulletIcon,
  QueueListIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/admin", label: "Overview", icon: Squares2X2Icon },
  { href: "/admin/tenants", label: "Tenants", icon: UserGroupIcon },
  { href: "/admin/tenants/new", label: "Create Tenant", icon: PlusCircleIcon },
  { href: "/admin/games", label: "Games", icon: PuzzlePieceIcon },
  { href: "/admin/assignments", label: "Assign Games", icon: ListBulletIcon },
  { href: "/admin/sessions", label: "Sessions", icon: QueueListIcon },
  { href: "/admin/callbacks", label: "Callbacks", icon: ListBulletIcon },
  { href: "/admin/transactions", label: "Transactions", icon: CurrencyDollarIcon },
  { href: "/admin/login", label: "Login", icon: ArrowRightOnRectangleIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-base-200 bg-base-100 px-5 py-6 lg:flex">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">
          Platform Admin
        </p>
      </div>
      <nav className="space-y-2 text-sm font-medium text-slate-600">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                active
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                  : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
