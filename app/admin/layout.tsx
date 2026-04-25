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
      <div className="h-screen flex overflow-hidden bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 h-full overflow-y-scroll admin-scrollbar admin-main relative">
          {/* Mobile Header — sticky glass */}
          <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 px-4 py-3 flex items-center gap-3 lg:hidden shadow-sm">
            <MobileMenuButton />
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-slate-200">
                <Image
                  src="/images/logo.jpg"
                  alt="Real Duck Distro"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-sm leading-tight">Admin</h1>
                <p className="text-[10px] text-slate-500 -mt-0.5">Real Duck Distro</p>
              </div>
            </div>
          </div>
          {/* Page content */}
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 admin-fade-in">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
