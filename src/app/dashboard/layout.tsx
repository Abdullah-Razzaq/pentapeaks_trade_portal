import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import { pool } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/signup");
  }

  let planType = "trial";
  let expiresAt: Date | null = null;
  let batch = "Not a Student";
  let proSearchedProductsCount = 0;
  
  if (session.role !== "admin") {
    const { rows } = await pool.query(
      "SELECT plan_type, subscription_expires_at, batch, pro_searched_products FROM users WHERE id = $1",
      [session.userId]
    );
    if (rows.length > 0) {
      planType = rows[0].plan_type;
      expiresAt = rows[0].subscription_expires_at;
      batch = rows[0].batch || "Not a Student";
      proSearchedProductsCount = Array.isArray(rows[0].pro_searched_products) 
        ? rows[0].pro_searched_products.length 
        : 0;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {planType === "trial" && session.role !== "admin" && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 px-4 py-3 text-center text-sm font-semibold shadow-sm backdrop-blur-sm relative z-50 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>1-Day Free Trial Active. Upgrade to Pro for unlimited trade intelligence access.</span>
          <Link href="/dashboard#pro-card" className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-amber-600 hover:-translate-y-0.5 whitespace-nowrap">
            Upgrade Now
          </Link>
        </div>
      )}
      <DashboardHeader 
        user={{ 
          name: session.name, 
          role: session.role,
          planType,
          expiresAt: expiresAt?.toISOString() || undefined,
          batch,
          proSearchedProductsCount
        }} 
      />
      <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      <Footer />
    </div>
  );
}
