import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import ProductForm from "../components/ProductForm";

export default async function NewProductPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return <ProductForm />;
}
