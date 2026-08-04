import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AccountActions from "@/components/AccountActions";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
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
    </div>
  );
}
