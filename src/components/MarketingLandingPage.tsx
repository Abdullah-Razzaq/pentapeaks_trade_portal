import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function MarketingLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 selection:bg-orange-500/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-200">
              <Image
                src="/logo.jpeg"
                alt="Pentapeaks Logo"
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              PENTAPEAKS TRADE PORTAL
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#products" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Products</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Subscriptions</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:block"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              Get Started
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
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1 */}
                  <Link href="/dashboard/find-buyer" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a3 3 0 003 3h10a3 3 0 003-3v-2" /></svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">Find Importers & Buyers Database</h3>
                    <p className="text-sm text-slate-700 flex-1">Access verified directories of international buyers actively seeking your products.</p>
                    <div className="mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>

                  {/* Card 2 */}
                  <Link href="/dashboard/find-supplier" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V9m0 0l-4 4m4-4l4 4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a3 3 0 013-3h10a3 3 0 013 3v2" /></svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">Find Global Suppliers & Manufacturers</h3>
                    <p className="text-sm text-slate-700 flex-1">Connect with reliable, vetted global manufacturers to streamline your supply chain.</p>
                    <div className="mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>

                  {/* Card 3 */}
                  <Link href="/dashboard/hs-code-search" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">Real-Time HS Code Search & Directory</h3>
                    <p className="text-sm text-slate-700 flex-1">Instantly lookup official Harmonized System codes for accurate product classification.</p>
                    <div className="mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
                      <span className="font-bold">-&gt;</span>
                    </div>
                  </Link>

                  {/* Card 4 */}
                  <Link href="/dashboard/check-tariff" className="group flex flex-col rounded-2xl border border-white/30 bg-white/20 p-6 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/30 hover:shadow-xl">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M2 12h20" /><path d="M12 2v20" /><path d="m4.93 4.93 14.14 14.14" /><path d="m4.93 19.07 14.14-14.14" /></svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">Customs Duty & Tariff Calculator</h3>
                    <p className="text-sm text-slate-700 flex-1">Calculate real-time import duties and taxes across different countries and regions.</p>
                    <div className="mt-4 flex justify-end text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto px-4 py-12">
                  {/* Pro Plan Card */}
                  <div className="bg-slate-950/80 backdrop-blur-md border border-blue-500/30 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3 6.5L22 9l-5 5 1.5 7L12 18l-6.5 3L7 14l-5-5 7-1.5z"></path></svg>
                        <h3 className="text-2xl font-bold">Pentapeaks Pro</h3>
                      </div>
                      <div className="mb-6">
                        <span className="text-3xl sm:text-5xl font-extrabold tracking-tight">4,500 PKR</span>
                        <span className="text-base text-blue-200 font-medium ml-1">/month</span>
                      </div>
                      <p className="text-blue-100/80 mb-8 text-base leading-relaxed">
                        Unlock full records, company filters, and 10 downloads/day.
                      </p>
                      <ul className="space-y-4 mb-10 text-sm font-medium">
                        <li className="flex items-start">
                          <svg className="mr-3 h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Full NTN and FBR Verified Data
                        </li>
                        <li className="flex items-start">
                          <svg className="mr-3 h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Every month new and more data added
                        </li>
                        <li className="flex items-start">
                          <svg className="mr-3 h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          View complete shipment quantity and value metrics
                        </li>
                        <li className="flex items-start">
                          <svg className="mr-3 h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Filter and search directly by company name
                        </li>
                      </ul>
                    </div>
                    <a
                      href="https://wa.me/923086222283?text=Hi%2C%20I%20would%20like%20to%20upgrade%20my%20PentaPeaks%20account"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 px-5 py-4 text-base font-bold text-white transition hover:from-blue-500 hover:to-blue-300 shadow-xl"
                    >
                      Contact Us to Upgrade -&gt;
                    </a>
                  </div>

                  {/* Premium Plan Card */}
                  <div className="bg-white/80 backdrop-blur-md border border-white/60 text-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3 6.5L22 9l-5 5 1.5 7L12 18l-6.5 3L7 14l-5-5 7-1.5z"></path></svg>
                        <h3 className="text-2xl font-bold">Pentapeaks Premium</h3>
                      </div>
                      <div className="flex justify-center mb-8">
                        <div className="bg-sky-50 p-6 rounded-full border border-sky-100">
                          <svg className="h-16 w-16 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3 6.5L22 9l-5 5 1.5 7L12 18l-6.5 3L7 14l-5-5 7-1.5z"></path></svg>
                        </div>
                      </div>
                      <div className="bg-amber-500/15 border border-amber-400/40 p-4 rounded-2xl flex items-start gap-3 mb-6">
                        <svg className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span className="text-amber-800 font-bold leading-tight">
                          Coming Soon — Big Development &amp; Features in Progress
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium text-center text-sm">
                      We&apos;re working on powerful new features to deliver even more value and smarter insights.
                    </p>
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
