"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef, createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { AimHyeLogo } from "@/components/AimHyeLogo";

export type AdminBranch = "IKOT_EKPENE" | "ITAM";
export const BranchContext = createContext<{ branch: AdminBranch; setBranch: (b: AdminBranch) => void }>({
  branch: "IKOT_EKPENE",
  setBranch: () => {},
});
export function useAdminBranch() { return useContext(BranchContext); }

const NAV = [
  {
    href: "/admin/dashboard", label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/admin/orders", label: "Orders",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    href: "/admin/payments", label: "Payments",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    href: "/admin/procurement", label: "Procurement",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    href: "/admin/stock", label: "Stock",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    href: "/admin/trucks", label: "Trucks & Crew",
    icon: "M8 18H5a2 2 0 01-2-2v-5l3-6h11l3 6v5a2 2 0 01-2 2h-3m-7 0a2 2 0 104 0m-4 0a2 2 0 114 0",
  },
  {
    href: "/admin/drivers", label: "Drivers & Salesboys",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    href: "/admin/empties", label: "Empties",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  },
  {
    href: "/admin/customers", label: "Customers",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    href: "/admin/changes", label: "Change Requests",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
  {
    href: "/admin/export", label: "Export (Peachtree)",
    icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branch, setBranch] = useState<AdminBranch>("IKOT_EKPENE");
  const [switching, setSwitching] = useState(false);
  const skipSwitch = useRef(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_branch") as AdminBranch | null;
    if (saved === "IKOT_EKPENE" || saved === "ITAM") {
      skipSwitch.current = true;
      setBranch(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_branch", branch);
    if (skipSwitch.current) { skipSwitch.current = false; return; }
    setSwitching(true);
    const t = setTimeout(() => setSwitching(false), 220);
    return () => clearTimeout(t);
  }, [branch]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f7" }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1c1c1e", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <BranchContext.Provider value={{ branch, setBranch }}>
    <div className="flex h-screen overflow-hidden" style={{ background: "#f5f5f7" }}>

      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200"
        style={{ width: sidebarOpen ? 240 : 64, background: "#1c1c1e" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow">
            <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-0.5" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <AimHyeLogo className="h-4 w-auto text-white" />
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "#e0302a" }}>Integrated Concepts</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active
                  ? { background: "#e0302a", color: "#fff" }
                  : { color: "rgba(255,255,255,0.55)" }
                }
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
              <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{session.user?.email}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {/* Branch switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
              {(["IKOT_EKPENE", "ITAM"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                  style={branch === b
                    ? { background: "#1c1c1e", color: "#fff" }
                    : { color: "#64748b" }
                  }
                >
                  {b === "IKOT_EKPENE" ? "Ikot Ekpene" : "Itam"}
                </button>
              ))}
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
            >
              View Storefront →
            </Link>
            <span className="text-xs text-slate-400 hidden lg:inline">
              {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-6 transition-opacity duration-200"
          style={{ opacity: switching ? 0 : 1 }}
        >
          {children}
        </main>
      </div>
    </div>
    </BranchContext.Provider>
  );
}
