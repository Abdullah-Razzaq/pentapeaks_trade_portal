import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

import { pool } from "@/lib/db";
import ProProductSelectionModal from "@/components/ProProductSelectionModal";
import AdminSubscriptionAlerts from "@/components/AdminSubscriptionAlerts";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { rows } = await pool.query(
    "SELECT plan_type, pro_products FROM users WHERE id = $1",
    [session.userId]
  );
  const planType = rows[0]?.plan_type || "trial";
  const proProducts = rows[0]?.pro_products || [];



  return (
    <div className="mx-auto max-w-7xl pb-16">
      {planType === "pro" && proProducts.length < 5 && (
        <ProProductSelectionModal />
      )}
      
      {session.role === "admin" && (
        <AdminSubscriptionAlerts />
      )}

      {/* Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back, {session.name}</h1>
          <p className="mt-1 text-gray-600">What would you like to look up today?</p>
        </div>

        {session.role !== "admin" && (
          <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-gray-200">
            <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${planType === "premium" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
              planType === "pro" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                "bg-gray-100 text-gray-700 border border-gray-300"
              }`}>
              {planType === "premium" ? "Premium Plan" : planType === "pro" ? "Pro Plan" : "Trial Plan"}
            </span>

          </div>
        )}
      </div>

      {/* Hero Billboard Banner (Full-Width) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/80 shadow-sm group mb-8">
        {/* Ambient Background Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none opacity-50 transition-opacity duration-700 group-hover:opacity-80"></div>

        <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight max-w-xl">
              Master Global Trade<br />with Pentapeaks.
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md leading-relaxed">
              Join our exclusive Import/Export Mentorship Program. Learn the secrets of international sourcing and global buyers directly from industry experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://pentapeaks.com/mentorship#curriculum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 hover:-translate-y-0.5 hover:shadow-amber-500/40"
              >
                Explore Mentorship
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </a>
              <a
                href="https://pentapeaks.com/mentorship#enroll"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-0.5"
              >
                Enroll Now
              </a>
            </div>
          </div>

          <div className="hidden md:block shrink-0 relative">
            <div className="w-48 h-48 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 drop-shadow-md">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.29 7 12 12 20.71 7"></polyline>
                <line x1="12" y1="22" x2="12" y2="12"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Content Column */}
        <div className="lg:col-span-2">

          {planType === "pro" && proProducts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Monitored Products For This Month</h3>
              <div className="flex flex-wrap gap-3">
                {proProducts.map((p: string) => {
                  return (
                    <Link
                      key={p}
                      href={`/dashboard/find-buyer?product=${encodeURIComponent(p)}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 border border-purple-200 shadow-sm hover:bg-purple-100 hover:shadow-md transition-all group"
                      title={p}
                    >
                      <span className="font-bold">{p}</span>
                      <svg className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trade Tools Grid */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Trade Tools</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Find Buyer */}
              <Link
                href="/dashboard/find-buyer"
                className="group relative rounded-2xl bg-gradient-to-br from-blue-50/60 to-white border border-blue-200/80 p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-400 hover:shadow-blue-500/10 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a3 3 0 003 3h10a3 3 0 003-3v-2" /></svg>
                  </div>
                  <span className="text-blue-500 font-bold transition-transform group-hover:translate-x-1">-&gt;</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Find Buyer</h2>
                <p className="text-sm text-slate-600 flex-1">Search our global directory of verified importers and buyers.</p>
              </Link>

              {/* Find Supplier */}
              <Link
                href="/dashboard/find-supplier"
                className="group relative rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200/80 p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-emerald-400 hover:shadow-emerald-500/10 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V9m0 0l-4 4m4-4l4 4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a3 3 0 013-3h10a3 3 0 013 3v2" /></svg>
                  </div>
                  <span className="text-emerald-500 font-bold transition-transform group-hover:translate-x-1">-&gt;</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Find Supplier</h2>
                <p className="text-sm text-slate-600 flex-1">Find top-tier exporters and manufacturing partners worldwide.</p>
              </Link>

              {/* HS Code Search */}
              <Link
                href="/dashboard/hs-code-search"
                className="group relative rounded-2xl bg-gradient-to-br from-purple-50/60 to-white border border-purple-200/80 p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-purple-400 hover:shadow-purple-500/10 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  </div>
                  <span className="text-purple-500 font-bold transition-transform group-hover:translate-x-1">-&gt;</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">HS Code Search</h2>
                <p className="text-sm text-slate-600 flex-1">Look up harmonized system tariff codes instantly.</p>
              </Link>

              {/* Check Duty & VAT */}
              <Link
                href="/dashboard/check-tariff"
                className="group relative rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-200/80 p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-amber-400 hover:shadow-amber-500/10 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M2 12h20" /><path d="M12 2v20" /><path d="m4.93 4.93 14.14 14.14" /><path d="m4.93 19.07 14.14-14.14" /></svg>
                  </div>
                  <span className="text-amber-500 font-bold transition-transform group-hover:translate-x-1">-&gt;</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Check Duty & VAT</h2>
                <p className="text-sm text-slate-600 flex-1">Calculate tariffs, duties, and VAT rates between countries.</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Brand Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 hidden lg:block">Satisfied Student Reviews</h3>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center group cursor-pointer mb-4">
              <div className="absolute inset-0 bg-[url('/images/img2.avif')] bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent flex items-end p-4">
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Watch how our partners leveraged Pentapeaks tools to slash sourcing times and negotiate better terms.
            </p>
            <a href="https://pentapeaks.com/mentorship" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-bold text-amber-600 hover:text-amber-500 transition-colors">
              Learn More <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="my-10 border-t border-gray-200"></div>

      {/* Upgrade Plan Section */}
      {planType === "trial" && session.role !== "admin" && (
        <div id="pro-card" className="mt-10 mb-6 scroll-mt-24 target:ring-4 target:ring-amber-500 target:bg-amber-50/50 transition-all duration-700 rounded-3xl p-2 -mx-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <div className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600">
              <span className="flex h-2 w-2 rounded-full bg-slate-600 mr-2"></span>
              Current: Trial
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pro Plan Card */}
            <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-xl text-gray-900 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pentapeaks Pro</h3>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">7,500 PKR</span>
                  <span className="text-base text-gray-600 font-medium ml-1">/month</span>
                </div>
                <p className="text-gray-600 mb-8 text-base leading-relaxed flex-1">
                  Unlock full records for 2 products of your choice and advanced company filters.
                </p>
                <ul className="space-y-4 mb-10 text-sm font-medium text-gray-700">
                  <li className="flex items-start">
                    <svg className="mr-3 h-5 w-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    Full NTN and FBR Verified Data
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-3 h-5 w-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    Every month new and more data added
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-3 h-5 w-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    View complete shipment quantity and value metrics
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-3 h-5 w-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    Filter and search directly by company name
                  </li>
                </ul>
                <a
                  href="https://wa.me/923086222283?text=Hi%2C%20I%20would%20like%20to%20upgrade%20my%20PentaPeaks%20account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-5 py-4 text-base font-bold text-slate-900 transition hover:bg-white shadow-xl"
                >
                  Contact Us to Upgrade
                </a>
              </div>
            </div>

            {/* Premium Plan Card */}
            <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-xl text-gray-900 relative overflow-hidden flex flex-col h-full group min-h-[400px] justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 opacity-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              </div>
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Pentapeaks Premium</h3>
                <div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-6 py-3 text-sm sm:text-base font-bold text-amber-700 shadow-sm border border-amber-200">
                    Coming Soon — Big Development & Features in Progress
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href="https://wa.me/923086222283"
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-bold text-gray-900 shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40 border border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span>Contact Us</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </a>

    </div>
  );
}
