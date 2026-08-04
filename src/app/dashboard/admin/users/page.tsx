import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminUsersPanel from "@/components/AdminUsersPanel";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminUsersPanel currentUserId={session.userId} />;
}
