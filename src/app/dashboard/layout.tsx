import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <DashboardHeader user={{ name: session.name, role: session.role }} />
      <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
