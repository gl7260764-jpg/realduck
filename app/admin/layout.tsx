import { isAuthenticated } from "@/lib/auth";
import AdminSidebar, { MobileMenuButton } from "./components/AdminSidebar";
import { SidebarProvider } from "./context/SidebarContext";
import Image from "next/image";

export const metadata = {
  title: "Admin Dashboard - Real Duck Distro",
  description: "Manage your products and orders",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  // Don't redirect if on login page - let the children render
  if (!authenticated) {
    return children;
  }

  return (
    <SidebarProvider>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 transition-all duration-300 h-full overflow-y-scroll admin-scrollbar">
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
            <MobileMenuButton />
            <div className="flex items-center gap-2">
              <div
                className="relative w-8 h-7 flex-shrink-0"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                }}
              >
                <Image
                  src="/images/logo.jpg"
                  alt="Real Duck Distro"
                  fill
                  className="object-cover"
                />
              </div>
              <h1 className="font-semibold text-gray-900">Admin</h1>
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
