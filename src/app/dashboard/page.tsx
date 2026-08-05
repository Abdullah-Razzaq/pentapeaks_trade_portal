import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AccountActions from "@/components/AccountActions";

import { pool } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { rows } = await pool.query(
    "SELECT plan_type, subscription_expires_at FROM users WHERE id = $1",
    [session.userId]
  );
  const planType = rows[0]?.plan_type || "trial";
  const subscriptionExpiresAt = rows[0]?.subscription_expires_at || null;

  let daysLeft = 0;
  if (subscriptionExpiresAt) {
    const diff = new Date(subscriptionExpiresAt).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          {session.role !== "admin" && (
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                planType === "premium" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                planType === "pro" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                "bg-gray-100 text-gray-800 border border-gray-200"
              }`}>
                {planType === "premium" ? "Premium Plan" : planType === "pro" ? "Pro Plan" : "Trial Plan"}
              </span>
              {planType === "trial" && (
                <span className="text-xs font-medium text-gray-500">
                  {daysLeft} {daysLeft === 1 ? "day" : "days"} left in your trial
                </span>
              )}
            </div>
          )}
        </div>
        <p className="mt-1 text-gray-500">What would you like to look up today?</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/find-buyer"
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a3 3 0 003 3h10a3 3 0 003-3v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Find Buyer</h2>
            <p className="mt-1 text-sm text-gray-500">Search global importers of your products</p>
          </Link>

          <Link
            href="/dashboard/find-supplier"
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path d="M12 21V9m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 8V6a3 3 0 013-3h10a3 3 0 013 3v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Find Supplier</h2>
            <p className="mt-1 text-sm text-gray-500">Search exporters and sourcing partners</p>
          </Link>

          <Link
            href="/dashboard/hs-code-search"
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">HS Code Search</h2>
            <p className="mt-1 text-sm text-gray-500">Search and look up harmonized system tariff codes</p>
          </Link>

          <Link
            href="/dashboard/check-tariff"
            className="group rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Check Duty / Tariff / VAT</h2>
            <p className="mt-1 text-sm text-gray-500">Calculate import/export tariffs, duties, and VAT rates between countries</p>
          </Link>
        </div>
      </div>

      <AccountActions user={{ name: session.name, role: session.role }} />

      {planType === "trial" && session.role !== "admin" && (
        <div className="mt-10 mb-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              <span className="flex h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              Current: Trial Plan
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pro Plan Card */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 p-8 shadow-xl text-white relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                    <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                    Available Now
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">Pentapeaks Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold tracking-tight">1200 PKR</span>
                  <span className="text-sm text-purple-200 font-medium ml-1">/month</span>
                </div>
                <p className="text-purple-100 mb-6 text-sm leading-relaxed flex-1">
                  Unlock full records, company filters, and 10 downloads/day.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-purple-50">
                  <li className="flex items-start">
                    <svg className="mr-2 h-5 w-5 text-purple-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Full NTN & Value visibility
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 h-5 w-5 text-purple-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Uncapped search results
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 h-5 w-5 text-purple-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    10 downloads/day
                  </li>
                </ul>
                <a 
                  href="mailto:admin@pentapeaks.com?subject=Upgrade%20to%20Pro"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-purple-900 transition hover:bg-gray-50 shadow-sm"
                >
                  Contact Admin to Upgrade
                </a>
              </div>
            </div>

            {/* Premium Plan Card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-8 shadow-xl text-white relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              </div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                    <span className="flex h-2 w-2 rounded-full bg-amber-300 mr-2"></span>
                    Coming Soon
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">Pentapeaks Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold tracking-tight">4500 PKR</span>
                  <span className="text-sm text-orange-200 font-medium ml-1">/month</span>
                </div>
                <p className="text-orange-100 mb-6 text-sm leading-relaxed flex-1">
                  Access verified contacts and live calculators.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-orange-50">
                  <li className="flex items-start">
                    <svg className="mr-2 h-5 w-5 text-orange-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Everything in Pro
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 h-5 w-5 text-orange-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Verified Contact Details
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 h-5 w-5 text-orange-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Live Tariff Calculator
                  </li>
                </ul>
                <button 
                  disabled
                  className="inline-flex w-full items-center justify-center rounded-lg bg-white/20 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition border border-white/10 cursor-not-allowed"
                >
                  Join the Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
