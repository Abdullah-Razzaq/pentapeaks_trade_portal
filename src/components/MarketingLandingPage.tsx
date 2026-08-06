import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function MarketingLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 selection:bg-orange-500/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
            <a href="#tariffs" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Tariffs</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Pricing</a>
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
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
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
                <a
                  href="mailto:cntct.pentapeaksintl@gmail.com"
                  className="group flex w-full items-center justify-center rounded-full border border-gray-300 bg-white/70 px-8 py-3.5 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:bg-gray-100 hover:text-gray-900 sm:w-auto"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500 group-hover:text-orange-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Watch Demo
                </a>
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

                <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                  {/* Pro Plan Card */}
                  <div className="rounded-3xl border border-white/30 bg-white/20 p-8 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:border-white/50 hover:bg-white/30 hover:shadow-xl relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Pentapeaks Pro</h3>
                      <div className="mb-6">
                        <span className="text-5xl font-extrabold tracking-tight text-slate-900">4,500 PKR</span>
                        <span className="text-base text-slate-600 font-medium ml-1">/month</span>
                      </div>
                      <p className="text-slate-600 mb-8 text-base leading-relaxed flex-1">
                        Unlock full records, company filters, and 10 downloads/day.
                      </p>
                      <ul className="space-y-4 mb-10 text-sm font-medium text-slate-700">
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
                        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-5 py-4 text-base font-bold text-slate-900 transition hover:bg-gray-100 shadow-xl"
                      >
                        Contact Us to Upgrade
                      </a>
                    </div>
                  </div>

                  {/* Premium Plan Card */}
                  <div className="rounded-3xl border border-white/30 bg-white/20 p-8 shadow-lg backdrop-blur-md text-slate-900 transition-all hover:border-white/50 hover:bg-white/30 hover:shadow-xl relative overflow-hidden flex flex-col h-full group min-h-[400px] justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 opacity-5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      <h3 className="text-3xl font-bold text-slate-900 mb-6">Pentapeaks Premium</h3>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-6 py-3 text-sm sm:text-base font-bold text-amber-700 shadow-sm border border-amber-200">
                          Coming Soon — Big Development & Features in Progress
                        </span>
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
