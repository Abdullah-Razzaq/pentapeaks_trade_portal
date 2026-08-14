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
  let adminStats = null;
  if (session.role === "admin") {
    const usersCountRes = await pool.query("SELECT COUNT(*) FROM users");
    const activeUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE is_active = true");
    const proUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE plan_type = 'pro'");
    const premiumUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE plan_type = 'premium'");
    const trialUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE plan_type = 'trial'");
    let tradeRecordsCount = 0;
    try {
      const tradeRecordsRes = await pool.query("SELECT COUNT(*) AS total_records FROM export_shipments");
      tradeRecordsCount = Number(tradeRecordsRes.rows[0].total_records);
    } catch {
      // Table might not exist yet if no data uploaded
    }

    adminStats = {
      totalUsers: usersCountRes.rows[0].count,
      activeUsers: activeUsersRes.rows[0].count,
      proUsers: proUsersRes.rows[0].count,
      premiumUsers: premiumUsersRes.rows[0].count,
      trialUsers: trialUsersRes.rows[0].count,
      tradeRecords: tradeRecordsCount,
    };
  }

  if (session.role === "admin") {
    return (
      <div className="mx-auto max-w-7xl pb-16">
         <AdminSubscriptionAlerts />
         <div className="mb-8">
           <h1 className="text-2xl font-bold tracking-tight text-[#17233D]">Good morning, {session.name}</h1>
           <p className="mt-1 text-[#64748B]">Here&apos;s what&apos;s happening across your PentaPeaks Trade Portal.</p>
         </div>

         {/* KPI Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
             <p className="text-sm font-semibold text-[#64748B] mb-2">Total Users</p>
             <p className="text-3xl font-bold text-[#17233D]">{adminStats?.totalUsers}</p>
           </div>
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
             <p className="text-sm font-semibold text-[#64748B] mb-2">Active Users</p>
             <p className="text-3xl font-bold text-[#17233D]">{adminStats?.activeUsers}</p>
           </div>
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
             <p className="text-sm font-semibold text-[#64748B] mb-2">Trade Records</p>
             <p className="text-3xl font-bold text-[#17233D]">{Number(adminStats?.tradeRecords).toLocaleString()}</p>
           </div>
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
             <p className="text-sm font-semibold text-[#64748B] mb-2">System Status</p>
             <div className="flex items-center gap-2 mt-2">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
               <span className="text-sm font-bold text-emerald-600">Operational</span>
             </div>
           </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column */}
           <div className="lg:col-span-2 space-y-8">
             
             {/* Quick Actions */}
             <div>
               <h2 className="text-lg font-bold text-[#17233D] mb-4">Quick Actions</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <Link href="/dashboard/admin/data-upload" className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:border-[#F97316] hover:bg-[#FFF7ED] transition-colors text-center group">
                   <svg className="w-6 h-6 text-[#F97316] mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   <span className="text-sm font-semibold text-[#17233D]">Upload Data</span>
                 </Link>
                 <Link href="/dashboard/find-buyer" className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors text-center group">
                   <svg className="w-6 h-6 text-[#2563EB] mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   <span className="text-sm font-semibold text-[#17233D]">Find Buyers</span>
                 </Link>
                 <Link href="/dashboard/admin/users" className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors text-center group">
                   <svg className="w-6 h-6 text-[#2563EB] mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   <span className="text-sm font-semibold text-[#17233D]">Manage Users</span>
                 </Link>
                 <Link href="/dashboard/hs-code-search" className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors text-center group">
                   <svg className="w-6 h-6 text-[#2563EB] mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   <span className="text-sm font-semibold text-[#17233D]">HS Codes</span>
                 </Link>
               </div>
             </div>

             {/* Recent Data Activity */}
             <div>
               <h2 className="text-lg font-bold text-[#17233D] mb-4">Recent Data Activity</h2>
               <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                 <table className="min-w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-[#F7F9FC] border-b border-[#E5E7EB]">
                     <tr>
                       <th className="px-6 py-3 font-semibold text-[#64748B]">Dataset</th>
                       <th className="px-6 py-3 font-semibold text-[#64748B]">Status</th>
                       <th className="px-6 py-3 font-semibold text-[#64748B]">Time</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#E5E7EB]">
                     <tr>
                       <td className="px-6 py-4 text-[#17233D] font-medium">Export Shipments (Auto-sync)</td>
                       <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Completed</span></td>
                       <td className="px-6 py-4 text-[#64748B]">Today</td>
                     </tr>
                     <tr>
                       <td className="px-6 py-4 text-[#17233D] font-medium">System Backup</td>
                       <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Completed</span></td>
                       <td className="px-6 py-4 text-[#64748B]">Yesterday</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>

           </div>

           {/* Right Column */}
           <div className="space-y-8">
             
             {/* Subscription Overview */}
             <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
               <h2 className="text-lg font-bold text-[#17233D] mb-4">Subscription Overview</h2>
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-[#64748B] font-medium text-sm">Pro Users</span>
                   <span className="text-[#17233D] font-bold">{adminStats?.proUsers}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[#64748B] font-medium text-sm">Premium Users</span>
                   <span className="text-[#17233D] font-bold">{adminStats?.premiumUsers}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[#64748B] font-medium text-sm">Free/Trial Users</span>
                   <span className="text-[#17233D] font-bold">{adminStats?.trialUsers}</span>
                 </div>
               </div>
             </div>

             {/* System Status */}
             <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
               <h2 className="text-lg font-bold text-[#17233D] mb-4">System Status</h2>
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-[#64748B] font-medium text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Database</span>
                   <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Operational</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[#64748B] font-medium text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> API Services</span>
                   <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Operational</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[#64748B] font-medium text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Data Pipeline</span>
                   <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Operational</span>
                 </div>
               </div>
             </div>

           </div>
         </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-16">
      {planType === "pro" && proProducts.length < 2 && (
        <ProProductSelectionModal />
      )}

      {/* Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#17233D]">Welcome back, {session.name}</h1>
          <p className="mt-1 text-[#64748B]">What would you like to look up today?</p>
        </div>

          <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] p-2 rounded-2xl shadow-sm">
            <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${planType === "premium" ? "bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5]" :
              planType === "pro" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                "bg-gray-50 text-gray-700 border border-gray-200"
              }`}>
              {planType === "premium" ? "Premium Plan" : planType === "pro" ? "Pro Plan" : "Trial Plan"}
            </span>
          </div>
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
      {planType === "trial" && (
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
            <div 
              className="relative p-4 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300"
              style={{
                background: "linear-gradient(145deg, #FFFFFF 0%, #F4F8FF 100%)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                borderRadius: "28px"
              }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF7A00] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                ★ Most Popular
              </div>

              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-[#17233D] leading-tight">Pentapeaks Pro</h3>
                    <p className="text-[10px] sm:text-sm font-medium text-[#3B82F6] mt-0.5">Powerful data. Bigger opportunities.</p>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-5xl font-extrabold tracking-tight text-[#17233D]">7,500 PKR</span>
                  <span className="text-xs sm:text-base text-[#17233D] font-bold ml-1 opacity-60">/month</span>
                </div>

                <p className="text-[#64748B] mb-6 sm:mb-8 text-[10px] sm:text-base leading-snug sm:leading-relaxed">
                  Unlock full records for 2 products of your choice and advanced company filters.
                </p>

                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 text-[10px] sm:text-sm font-medium text-[#17233D]">
                  <li className="flex items-start">
                    <svg className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Full NTN and FBR Verified Data
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Every month new and more data added
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    View complete shipment quantity and value metrics
                  </li>
                  <li className="flex items-start">
                    <svg className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Filter and search directly by company name
                  </li>
                </ul>
              </div>
              <a
                href="https://wa.me/923086222283?text=Hi%2C%20I%20would%20like%20to%20upgrade%20my%20PentaPeaks%20account"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-base font-bold text-white transition-transform hover:-translate-y-0.5 shadow-md"
                style={{
                  background: "linear-gradient(90deg, #2563EB, #3B82F6)",
                  borderRadius: "14px"
                }}
              >
                Contact Us to Upgrade &rarr;
              </a>
            </div>

            {/* Premium Plan Card */}
            <div 
              className="relative p-4 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden min-h-[400px]"
              style={{
                background: "linear-gradient(145deg, #FFFFFF 0%, #FFFDFC 100%)",
                border: "1px solid rgba(255, 122, 0, 0.15)",
                borderRadius: "28px"
              }}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF7A00] shrink-0 border border-orange-100 shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-[#17233D] leading-tight">Pentapeaks Premium</h3>
                    <p className="text-[10px] sm:text-sm font-medium text-[#FF7A00] mt-0.5">Smarter insights. Greater value.</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10 relative">
                  {/* Premium Center Visual */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-[#FF7A00] animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full border border-dashed border-[#2563EB] animate-[spin_15s_linear_infinite_reverse]"></div>
                    <svg className="absolute w-12 h-12 sm:w-16 sm:h-16 text-[#FF7A00]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3 6.5L22 9l-5 5 1.5 7L12 18l-6.5 3L7 14l-5-5 7-1.5z"></path></svg>
                  </div>

                  {/* Coming Soon Panel */}
                  <div 
                    className="relative z-10 w-full sm:w-10/12 rounded-[20px] p-4 sm:p-6 text-center flex flex-col items-center justify-center shadow-sm"
                    style={{
                      background: "#FFF5E8",
                      border: "1px solid #FFD39B"
                    }}
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF7A00] mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h4 className="text-lg sm:text-xl font-bold text-[#FF7A00] mb-1">Coming Soon</h4>
                    <p className="text-[10px] sm:text-xs font-bold text-[#17233D]">Big Development &amp; Features in Progress</p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-[#64748B] font-medium text-[10px] sm:text-sm leading-snug sm:leading-normal">
                    We&apos;re working on powerful new features to deliver even more value and smarter insights.
                  </p>
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
