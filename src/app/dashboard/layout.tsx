"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, User, Shield, Package, Lock } from "lucide-react";

interface DashboardHeaderProps {
  user: {
    name: string;
    role: "admin" | "user";
    planType?: string;
    expiresAt?: string;
    batch?: string;
    proSearchedProductsCount?: number; // 👈 Resolved TypeScript property
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formattedExpiry = user.expiresAt
    ? new Date(user.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo / Portal Title */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              PentaPeaks <span className="text-amber-600">Trade Portal</span>
            </span>
          </Link>
          {user.role === "admin" ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
              <Shield className="h-3 w-3" /> Admin
            </span>
          ) : (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
              user.planType === "pro" 
                ? "bg-amber-50 text-amber-800 ring-amber-600/20" 
                : "bg-gray-50 text-gray-700 ring-gray-600/20"
            }`}>
              {user.planType || "Trial"}
            </span>
          )}
        </div>

        {/* Right Section: Pro Quota & User Menu */}
        <div className="flex items-center gap-4">
          
          {/* Pro Monthly Monitored Products Counter Badge */}
          {user.role !== "admin" && user.planType === "pro" && (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Package className="h-3.5 w-3.5 text-amber-600" />
              <span>Products Monitored: <strong className="text-slate-900">{user.proSearchedProductsCount ?? 0}/5</strong></span>
            </div>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-full bg-slate-100 p-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline-block font-semibold text-slate-800 pr-1">{user.name}</span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white p-2 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none z-50">
                <div className="border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
                  <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="capitalize">Batch: {user.batch || "N/A"}</p>
                  {formattedExpiry && user.planType === "pro" && (
                    <p className="mt-1 text-amber-700 font-medium">Renews: {formattedExpiry}</p>
                  )}
                </div>

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="h-4 w-4 text-purple-600" /> Admin Dashboard
                  </Link>
                )}

                <Link
                  href="/api/auth/signout"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors mt-1 font-medium"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}