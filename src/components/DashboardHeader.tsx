"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import ChangePasswordModal from "./ChangePasswordModal";

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
  { href: "/dashboard/inquiries", label: "Inquiries" },
];

export default function DashboardHeader({
  user,
}: {
  user: { name: string; role: "admin" | "user"; planType?: string; expiresAt?: string; batch?: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems =
    user.role === "admin"
      ? [...baseNavItems, { href: "/dashboard/admin/users", label: "Manage Users" }, { href: "/dashboard/admin/subscriptions", label: "Our Subscriptions" }]
      : baseNavItems;

  useEffect(() => {
    if (user.role === "admin") {
      fetch("/api/admin/subscriptions/alerts")
        .then(res => res.json())
        .then(data => {
          if (data.alerts) setAlertsCount(data.alerts.length);
        })
        .catch(console.error);
    }
  }, [user.role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="relative z-50 bg-gray-50 border-b border-gray-200 shadow-sm transition-all duration-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          
          <div className="flex items-center gap-4">
            <Link className="flex items-center gap-3 group" href="/dashboard">
              <div className="flex items-center justify-center rounded-full border border-gray-300 bg-white p-1 shadow-sm transition group-hover:scale-105">
                <Image 
                  alt="Pentapeaks Trade Portal Logo" 
                  className="rounded-full object-contain" 
                  height={36}
                  width={36}
                  sizes="36px"
                  priority 
                  src="/logo.jpeg" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                  Pentapeaks
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mt-1">
                  Trade Portal
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1.5 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-right">
            
            {user.role !== "admin" && (user.planType === "pro" || user.planType === "premium") && (
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/20 border border-amber-600/40 text-amber-950 px-3 py-1 rounded-full text-xs font-bold shadow-sm mr-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {user.expiresAt 
                  ? `Pro Plan Renews: ${new Date(user.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` 
                  : "Active Pro Member"}
              </div>
            )}

            <div className="hidden sm:flex flex-col text-right">
              <p className="text-sm font-semibold text-gray-900">{user.name} &bull; <span className="text-emerald-400">Online</span></p>
            </div>
            
            {user.role === "admin" && (
              <Link href="/dashboard/admin/subscriptions" className="relative p-2 text-gray-400 hover:text-amber-500 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {alertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </Link>
            )}

            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-900 border border-gray-300 cursor-pointer hover:border-amber-500 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white border border-gray-200 shadow-2xl focus:outline-none z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-sm ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </p>
                      {user.role !== 'admin' && user.batch && (
                        <p className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">
                          {user.batch}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setPasswordModalOpen(true);
                      }}
                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-amber-500 transition-colors"
                    >
                      <svg className="mr-3 h-4 w-4 text-gray-500 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="group flex w-full items-center px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                      <svg className="mr-3 h-4 w-4 text-rose-500/70 group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <nav className="flex gap-1.5 overflow-x-auto border-t border-gray-200 px-4 py-2.5 md:hidden hide-scrollbar">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                    : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      
      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </>
  );
}
