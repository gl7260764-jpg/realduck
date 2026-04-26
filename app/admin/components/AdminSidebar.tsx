"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
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
  Link2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  accent?: string; // tailwind gradient class fragments e.g. "from-blue-500 to-indigo-600"
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, accent: "from-violet-500 to-purple-600" },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, accent: "from-blue-500 to-cyan-500" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, accent: "from-emerald-500 to-teal-600" },
      { href: "/admin/products", label: "Products", icon: Package, accent: "from-amber-500 to-orange-600" },
    ],
  },
  {
    label: "Content & Reach",
    items: [
      { href: "/admin/blog", label: "Blog Posts", icon: FileText, accent: "from-rose-500 to-pink-600" },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone, accent: "from-fuchsia-500 to-purple-600" },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail, accent: "from-sky-500 to-blue-600" },
      { href: "/admin/links", label: "Link Tracking", icon: Link2, accent: "from-indigo-500 to-violet-600" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/pwa", label: "PWA & Push", icon: Smartphone, accent: "from-cyan-500 to-blue-600" },
      { href: "/admin/settings", label: "Settings", icon: Settings, accent: "from-slate-500 to-slate-700" },
    ],
  },
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden animate-[fadeIn_200ms_ease-out]"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          admin-sidebar fixed left-0 top-0 h-full
          flex flex-col z-50
          w-72 sm:w-64 2xl:w-72
          transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Close sidebar"
          className="absolute top-3 right-3 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.06] relative">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(400px 80px at 50% 0%, rgba(168,85,247,0.18), transparent 65%)",
            }}
          />
          <Link href="/admin" className="relative flex items-center gap-3 group" onClick={closeSidebar}>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/40 group-hover:ring-white/30 transition-all">
              <Image src="/images/logo.jpg" alt="Real Duck Distro" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-bold text-sm tracking-tight truncate">Real Duck Distro</h1>
              <p className="text-white/40 text-[11px] font-medium tracking-wide uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Admin Panel
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto admin-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.14em]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSidebar}
                      className={`
                        admin-nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-[13.5px] font-medium transition-all duration-200
                        ${isActive
                          ? "bg-white/[0.08] text-white shadow-inner"
                          : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span
                          aria-hidden
                          className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b ${item.accent || "from-blue-500 to-indigo-600"}`}
                        />
                      )}
                      <span className={`
                        flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0
                        transition-all duration-200
                        ${isActive
                          ? `bg-gradient-to-br ${item.accent || "from-blue-500 to-indigo-600"} shadow-lg shadow-black/30 text-white`
                          : "bg-white/[0.04] text-white/60 group-hover:bg-white/[0.08] group-hover:text-white"
                        }
                      `}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-1 bg-black/20">
          <Link
            href="/"
            onClick={closeSidebar}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-white/60 hover:bg-white/[0.05] hover:text-white transition-all duration-200 group"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] text-white/60 group-hover:bg-white/[0.08] group-hover:text-white transition-all">
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
            </span>
            <span>View Store</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-white/60 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 group"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] text-white/60 group-hover:bg-rose-500/15 group-hover:text-rose-300 transition-all">
              <LogOut className="w-3.5 h-3.5" strokeWidth={2.4} />
            </span>
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
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-all lg:hidden"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
