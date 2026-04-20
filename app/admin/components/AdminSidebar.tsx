"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Plus,
  LogOut,
  Settings,
  BarChart3,
  ShoppingBag,
  X,
  Menu,
  FileText,
  Megaphone,
  Smartphone,
  Mail,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/products/new", label: "Add Product", icon: Plus },
  { href: "/admin/blog", label: "Blog Posts", icon: FileText },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/pwa", label: "PWA & Push", icon: Smartphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-slate-900 border-r border-white/5 flex flex-col z-50
          transition-all duration-300 ease-in-out
          w-64
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-3" onClick={closeSidebar}>
            <div
              className="relative w-10 h-9 flex-shrink-0"
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
            <div>
              <h1 className="text-white font-semibold text-sm">Real Duck Distro</h1>
              <p className="text-white/40 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors duration-200"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>View Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Mobile Menu Button Component
export function MobileMenuButton() {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
