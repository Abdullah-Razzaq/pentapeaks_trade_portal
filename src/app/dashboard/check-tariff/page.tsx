import CheckTariffCalculator from "@/components/CheckTariffCalculator";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CheckTariffPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col mx-auto max-w-7xl min-h-[calc(100vh-200px)]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-sky-50/90 via-blue-50/40 to-amber-50/50 p-6 sm:p-8 shadow-sm mb-8">
        <div className="relative z-10">
          <h1 className="text-slate-900 font-extrabold tracking-tight text-2xl sm:text-3xl">Check Duty / Tariff / VAT</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
            Calculate import/export tariffs, duties, and VAT rates between countries to accurately forecast your landed costs.
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full">
        <CheckTariffCalculator />
      </div>
    </div>
  );
}
