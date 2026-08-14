import Link from "next/link";

import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

export default function MarketingLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 selection:bg-orange-500/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <div>
            <Logo />
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#products" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Products</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Subscriptions</a>
            <Link href="/signup" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Inquiries</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40 bg-[url('/images/img1.avif')] bg-cover bg-center">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>

          <div className="container relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Pakistan&apos;s Premier B2B Trade Intelligence & Verified Buyer Database
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-800 font-medium">
                Access thousands of verified importers, suppliers, tariff calculation tools, and raw trade data in one streamlined portal.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center rounded-full bg-orange-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 sm:w-auto"
                >
                  Explore Portal <span className="ml-2 font-bold">-&gt;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Products and Pricing Wrapper */}
        <div
          className="relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/img3.jfif')" }}
        >
          {/* Light Sunset / Sky Blue Tint Overlay */}
          <div className="absolute inset-0 bg-sky-100/40 backdrop-blur-[1px]"></div>
          <div className="relative z-10">
            {/* Feature Grid */}
            <section id="products" className="border-t border-slate-700/50 py-24">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 items-stretch">
                  {/* Card 1 */}
                  <Link href="/dashboard/find-buyer" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-3 sm:p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-2 sm:mb-4 inline-flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4 sm:h-6 sm:w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a3 3 0 003 3h10a3 3 0 003-3v-2" /></svg>
                    </div>
                    <h3 className="mb-1 sm:mb-2 text-xs sm:text-lg font-semibold text-slate-900 leading-tight">Find Importers & Buyers Database</h3>
                    <p className="text-[10px] sm:text-sm leading-snug sm:leading-normal text-slate-700 flex-1">Access verified directories of international buyers actively seeking your products.</p>
                    <div className="mt-2 sm:mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>

                  {/* Card 2 */}
                  <Link href="/dashboard/find-supplier" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-3 sm:p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-2 sm:mb-4 inline-flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4 sm:h-6 sm:w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V9m0 0l-4 4m4-4l4 4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a3 3 0 013-3h10a3 3 0 013 3v2" /></svg>
                    </div>
                    <h3 className="mb-1 sm:mb-2 text-xs sm:text-lg font-semibold text-slate-900 leading-tight">Find Global Suppliers & Manufacturers</h3>
                    <p className="text-[10px] sm:text-sm leading-snug sm:leading-normal text-slate-700 flex-1">Connect with reliable, vetted global manufacturers to streamline your supply chain.</p>
                    <div className="mt-2 sm:mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>

                  {/* Card 3 */}
                  <Link href="/dashboard/hs-code-search" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-3 sm:p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-2 sm:mb-4 inline-flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4 sm:h-6 sm:w-6"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <h3 className="mb-1 sm:mb-2 text-xs sm:text-lg font-semibold text-slate-900 leading-tight">Real-Time HS Code Search & Directory</h3>
                    <p className="text-[10px] sm:text-sm leading-snug sm:leading-normal text-slate-700 flex-1">Instantly lookup official Harmonized System codes for accurate product classification.</p>
                    <div className="mt-2 sm:mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>

                  {/* Card 4 */}
                  <Link href="/dashboard/check-tariff" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-3 sm:p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-2 sm:mb-4 inline-flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-4 w-4 sm:h-6 sm:w-6"><path d="M2 12h20" /><path d="M12 2v20" /><path d="m4.93 4.93 14.14 14.14" /><path d="m4.93 19.07 14.14-14.14" /></svg>
                    </div>
                    <h3 className="mb-1 sm:mb-2 text-xs sm:text-lg font-semibold text-slate-900 leading-tight">Customs Duty & Tariff Calculator</h3>
                    <p className="text-[10px] sm:text-sm leading-snug sm:leading-normal text-slate-700 flex-1">Calculate real-time import duties and taxes across different countries and regions.</p>
                    <div className="mt-2 sm:mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl font-extrabold text-slate-900 drop-shadow-sm sm:text-4xl">Simple, Transparent Pricing</h2>
                  <p className="mt-4 text-lg font-semibold text-slate-800 drop-shadow-sm">Choose the plan that fits your business needs and scale your global trade operations.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto px-4 py-12">
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
                    className="relative p-4 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
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
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
