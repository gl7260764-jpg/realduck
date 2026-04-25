import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LinksClient from "./LinksClient";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const auth = await isAuthenticated();
  if (!auth) redirect("/admin/login");
  return <LinksClient />;
}
