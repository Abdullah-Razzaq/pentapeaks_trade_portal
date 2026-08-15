import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";
import { pool } from "@/lib/db";
import CopyProtection from "@/components/CopyProtection";
import SessionTimeoutProvider from "@/components/providers/SessionTimeoutProvider";

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
  if (session.role !== "admin") {
    const { rows } = await pool.query(
      "SELECT plan_type, subscription_expires_at, batch FROM users WHERE id = $1",
      [session.userId]
    );
    if (rows.length > 0) {
      planType = rows[0].plan_type;
      expiresAt = rows[0].subscription_expires_at;
      batch = rows[0].batch || "Not a Student";
    }
  }

  return (
    <SessionTimeoutProvider>
      <CopyProtection isAdmin={session.role === "admin"} />
      <div className="flex flex-col h-screen overflow-hidden w-full">
        {planType === "trial" && session.role !== "admin" && (
          <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 px-4 py-2 text-center text-sm font-semibold shadow-sm shrink-0 relative z-[100]">
            Your 1-day free trial is active. Upgrade to Pro to unlock unlimited access and prevent loss of access.
          </div>
        )}
        <div className="flex-1 flex min-h-0 relative">
          <DashboardShell
            user={{ 
              name: session.name, 
              role: session.role,
              planType,
              expiresAt: expiresAt?.toISOString() || undefined,
              batch
            }} 
          >
            {children}
          </DashboardShell>
        </div>
      </div>
    </SessionTimeoutProvider>
  );
}
