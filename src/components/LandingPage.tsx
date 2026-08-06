import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import Footer from "./Footer";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 selection:bg-amber-500/30">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-gray-50/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-md border border-white/20">
              <Image 
                src="/logo.jpeg" 
                alt="Pentapeaks Logo" 
                fill 
                className="object-cover" 
                sizes="32px"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Pentapeaks
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Products</Link>
            <Link href="#tariffs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Tariffs</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            {session ? (
              <Link 
                href="/dashboard"
                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="hidden rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:block"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup"
                  className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-600 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40 bg-[url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rtCNqWy8XydeloBkFT6nC7XJHY7cnRcKaZorCsWm2A&s=10')] bg-cover bg-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"></div>
          <div className="absolute top-0 right-0 -mr-40 -mt-20 opacity-20 pointer-events-none md:block hidden">
            <svg width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.29 7 12 12 20.71 7"></polyline>
              <line x1="12" y1="22" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className="container relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur-md rounded-3xl p-8 sm:p-16 shadow-2xl mx-auto max-w-5xl">
              <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Pakistan&apos;s Premier B2B Trade Intelligence & Verified Buyer Database
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">
                The ultimate B2B trade portal. Discover verified international buyers, source from reliable global suppliers, and calculate complex tariff rates instantly.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link 
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-full bg-amber-500 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-500/40 sm:w-auto"
                >
                  Explore Portal <span className="ml-2 font-bold">-&gt;</span>
                </Link>
                <button 
                  className="group flex w-full items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white sm:w-auto"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative border-t border-slate-700/50 py-24 min-h-[600px] flex items-center">
          <div 
            className="absolute inset-0 z-0" 
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&q=80')", 
              backgroundSize: 'cover', 
              backgroundPosition: 'center', 
              backgroundRepeat: 'no-repeat' 
            }}
          >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"></div>
          </div>
          
          <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything You Need to Trade</h2>
              <p className="mt-4 text-gray-300">Powerful tools designed for serious importers and exporters.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Link href="/dashboard" key={feature.title} className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-md p-6 shadow-xl transition-all hover:border-amber-500/50 hover:bg-slate-800 flex flex-col h-full">
                  <div className="mb-4 inline-flex rounded-lg bg-amber-500/10 p-3 text-amber-500">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400 flex-1">{feature.description}</p>
                  <div className="mt-4 flex justify-end">
                    <span className="text-amber-500 font-bold transition-transform group-hover:translate-x-1">-&gt;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const features = [
  {
    title: "Find Importers & Buyers Database",
    description: "Access a verified database of international importers actively looking for your products.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Find Global Suppliers & Manufacturers",
    description: "Connect with reliable, vetted global manufacturers to streamline your supply chain.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "Real-Time HS Code Search & Directory",
    description: "Instantly lookup official Harmonized System codes for accurate product classification.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    title: "Customs Duty & Tariff Calculator",
    description: "Calculate real-time import duties and taxes across different countries and regions.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];
