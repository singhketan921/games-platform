"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PuzzlePieceIcon,
  UserGroupIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  QueueListIcon,
  ListBulletIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  { label: "Overview", href: "/admin", icon: Squares2X2Icon },
  { label: "Tenants", href: "/admin/tenants", icon: UserGroupIcon },
  { label: "Create Tenant", href: "/admin/tenants/new", icon: ShieldCheckIcon },
  { label: "Games", href: "/admin/games", icon: PuzzlePieceIcon },
  { label: "Assign Games", href: "/admin/assignments", icon: DocumentDuplicateIcon },
  { label: "Sessions", href: "/admin/sessions", icon: QueueListIcon },
  { label: "Callbacks", href: "/admin/callbacks", icon: ListBulletIcon },
  { label: "Transactions", href: "/admin/transactions", icon: CreditCardIcon },
  { label: "Login", href: "/admin/login", icon: ArrowRightOnRectangleIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="drawer-side shadow-lg">
      <label htmlFor="admin-drawer" className="drawer-overlay" />
      <div className="menu p-4 w-72 bg-base-200 min-h-full space-y-4">
        <div className="px-2 py-3 rounded-2xl bg-white text-sm font-semibold tracking-[.3em] text-indigo-600">
          Platform Admin
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
