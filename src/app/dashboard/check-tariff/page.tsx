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
      <div className="bg-[#0a0d12] rounded-3xl p-8 sm:p-12 mb-8 relative overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">Check Duty / Tariff / VAT</h1>
          <p className="text-gray-400 max-w-xl leading-relaxed">
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
