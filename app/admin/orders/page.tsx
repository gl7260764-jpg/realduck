import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { MobileMenuButton } from "../components/AdminSidebar";
import OrdersTable from "./components/OrdersTable";

export default async function OrdersPage() {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage customer orders and update their status
            </p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable />
    </div>
  );
}
