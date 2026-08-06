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
];

export default function DashboardHeader({
  user,
}: {
  user: { name: string; role: "admin" | "user" };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems =
    user.role === "admin"
      ? [...baseNavItems, { href: "/dashboard/admin/users", label: "Manage Users" }]
      : baseNavItems;

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
            
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-sm font-semibold text-gray-900">{user.name} &bull; <span className="text-emerald-400">Online</span></p>
            </div>
            
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
                      {user.role !== 'admin' && (
                        <p className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm">
                          Batch 25
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
