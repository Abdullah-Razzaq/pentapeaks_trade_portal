import CompanyExplorer from "@/components/CompanyExplorer";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function FindBuyerPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  
  return <CompanyExplorer mode="buyer" userRole={session.role} />;
}
