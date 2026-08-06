import CompanyExplorer from "@/components/CompanyExplorer";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FindSupplierPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  
  return (
    <div className="flex flex-col mx-auto max-w-7xl min-h-[calc(100vh-200px)]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-sky-50/90 via-blue-50/40 to-amber-50/50 p-6 sm:p-8 shadow-sm mb-8">
        <div className="relative z-10">
          <h1 className="text-slate-900 font-extrabold tracking-tight text-2xl sm:text-3xl">Find Supplier</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
            Source high-quality products directly from verified manufacturers. Analyze their export history to ensure reliability.
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full">
        <CompanyExplorer mode="supplier" userRole={session.role} />
      </div>
    </div>
  );
}
