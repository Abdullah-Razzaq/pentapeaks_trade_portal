import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 py-12 border-t border-gray-200 shadow-sm font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">

          {/* Column 1: Brand */}
          <div className="flex flex-col lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white p-1">
                <Image src="/logo.jpeg" alt="Pentapeaks Logo" width={32} height={32} className="rounded-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">PentaPeaks International</span>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              PentaPeaks Trade Portal — Pakistan&apos;s Gateway to Global Markets.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <a href="https://www.facebook.com/people/PentaPeaks-International/61589825756983/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-500 transition-colors" title="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
              </a>
              <a href="https://www.instagram.com/pentapeaks_intl" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-500 transition-colors" title="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/pentapeaks-international-pvt-ltd/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-500 transition-colors" title="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@pentapeaks_intl" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-500 transition-colors" title="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v8.12c0 2.26-.54 4.54-1.89 6.36-1.32 1.8-3.41 3.12-5.63 3.39-2.29.28-4.71-.05-6.6-1.35-1.95-1.34-3.27-3.49-3.52-5.83-.26-2.33.4-4.8 1.95-6.49 1.58-1.72 4.02-2.64 6.36-2.48.1.58.2 1.17.29 1.75-.82-.04-1.68.03-2.45.32-1.45.54-2.58 1.9-2.84 3.44-.27 1.63.4 3.39 1.72 4.41 1.35 1.05 3.33 1.25 4.88.58 1.6-.68 2.6-2.35 2.6-4.14V.02h.02z" /></svg>
              </a>
              <a href="https://www.youtube.com/@PentaPeaksInternational" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-500 transition-colors" title="YouTube">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Portal Quick Tools */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link href="/dashboard/find-buyer" className="hover:text-amber-500 transition-colors">Find Buyer</Link></li>
              <li><Link href="/dashboard/find-supplier" className="hover:text-amber-500 transition-colors">Find Supplier</Link></li>
              <li><Link href="/dashboard/hs-code-search" className="hover:text-amber-500 transition-colors">HS Code Search</Link></li>
              <li><Link href="/dashboard/check-tariff" className="hover:text-amber-500 transition-colors">Tariff / Duty Calculator</Link></li>
            </ul>
          </div>

          {/* Column 3: Mentorship & Services */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Mentorship & Portal</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="https://pentapeaks.com/mentorship" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">Import/Export Mentorship</a></li>
              <li><a href="https://pentapeaks.com/supplier" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">Become a Supplier</a></li>
              <li><a href="https://pentapeaks.com/buyer" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">Buyer Inquiry</a></li>
              <li><a href="https://pentapeaks.com/about" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Column 4: Pakistan Office */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Pakistan Office</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>WAPDA Town Lahore,<br />Pakistan</span>
              </li>
              <li className="flex items-center gap-3 mt-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href="tel:+923086222283" className="hover:text-amber-500 transition-colors">+92 308 6222283</a>
              </li>
              <li className="flex items-center gap-3 mt-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href="mailto:info@pentapeaks.com" className="hover:text-amber-500 transition-colors">info@pentapeaks.com</a>
              </li>
              <li className="flex items-start gap-3 mt-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs leading-relaxed">Mon-Fri: 9AM - 6PM (PKT)<br />Sat: 10AM - 2PM</span>
              </li>
            </ul>
          </div>

          {/* Column 5: USA Office */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">USA Office</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>237 N 13th St,<br />Allentown, PA 18102, USA</span>
              </li>
              <li className="flex items-center gap-3 mt-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href="tel:+16096355116" className="hover:text-amber-500 transition-colors">+1 609 635 5116</a>
              </li>
              <li className="flex items-center gap-3 mt-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href="mailto:info@pentapeaks.com" className="hover:text-amber-500 transition-colors">info@pentapeaks.com</a>
              </li>
              <li className="flex items-start gap-3 mt-2">
                <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs leading-relaxed">Mon-Fri: 9AM - 5PM (EST)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 PentaPeaks International. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
