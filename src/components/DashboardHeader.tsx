"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

type NavItem = {
  href: string;
  label: string;
};

const baseNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/find-buyer", label: "Find Buyer" },
  { href: "/dashboard/find-supplier", label: "Find Supplier" },
  { href: "/dashboard/hs-code-search", label: "HS Code Search" },
  { href: "/dashboard/check-tariff", label: "Check Tariff/VAT" },
];

export default function DashboardHeader({
  user,
}: {
  user: { name: string; role: "admin" | "user" };
}) {
  const pathname = usePathname();

  const navItems =
    user.role === "admin"
      ? [...baseNavItems, { href: "/dashboard/admin/users", label: "Manage Users" }]
      : baseNavItems;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link className="flex items-center gap-3" href="/dashboard">
          <div className="flex items-center justify-center rounded-full border-2 border-black/80 bg-white p-1 shadow-sm">
            <Image 
              alt="Pentapeaks Trade Portal Logo" 
              className="rounded-full object-contain" 
              height={36}
              width={36}
              priority 
              src="/logo.jpeg" 
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Pentapeaks Trade Portal
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">{user.role}</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
