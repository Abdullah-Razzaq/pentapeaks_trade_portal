import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CheckTariffCalculator from "@/components/CheckTariffCalculator";

export default async function CheckTariffPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Check Duty / Tariff / VAT</h1>
        <p className="mt-1 text-sm text-gray-500">
          Calculate import/export tariffs, duties, and VAT rates between countries.
        </p>
      </div>

      <CheckTariffCalculator />
    </div>
  );
}
