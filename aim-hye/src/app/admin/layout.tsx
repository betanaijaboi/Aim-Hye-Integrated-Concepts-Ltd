"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef, createContext, useContext } from "react";
import Link from "next/link";

export type AdminBranch = "IKOT_EKPENE" | "ITAM";
export const BranchContext = createContext<{ branch: AdminBranch; setBranch: (b: AdminBranch) => void }>({
  branch: "IKOT_EKPENE",
  setBranch: () => {},
});
export function useAdminBranch() { return useContext(BranchContext); }

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/procurement", label: "Procurement", icon: "🏭" },
  { href: "/admin/stock", label: "Stock", icon: "📦" },
  { href: "/admin/trucks", label: "Trucks & Crew", icon: "🚛" },
  { href: "/admin/drivers", label: "Drivers & Salesboys", icon: "👤" },
  { href: "/admin/empties", label: "Empties", icon: "🍺" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/changes", label: "Change Requests", icon: "🔄" },
  { href: "/admin/export", label: "Export (Peachtree)", icon: "📤" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branch, setBranch] = useState<AdminBranch>("IKOT_EKPENE");
  const [switching, setSwitching] = useState(false);
  // Skip the switching animation on mount (initial render + localStorage restore)
  const skipSwitch = useRef(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Restore persisted branch from localStorage (no animation)
  useEffect(() => {
    const saved = localStorage.getItem("admin_branch") as AdminBranch | null;
    if (saved === "IKOT_EKPENE" || saved === "ITAM") {
      skipSwitch.current = true;
      setBranch(saved);
    }
  }, []);

  // Persist branch + trigger content fade (skip on first render)
  useEffect(() => {
    localStorage.setItem("admin_branch", branch);
    if (skipSwitch.current) { skipSwitch.current = false; return; }
    setSwitching(true);
    const t = setTimeout(() => setSwitching(false), 220);
    return () => clearTimeout(t);
  }, [branch]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <BranchContext.Provider value={{ branch, setBranch }}>
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#1e3a5f] text-white flex flex-col transition-all duration-200 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-blue-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-white text-lg flex-shrink-0">
            A
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm leading-tight">Aim-Hye</p>
              <p className="text-xs text-blue-300">Integrated Concepts</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1 transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-blue-800">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white">{session.user?.name}</p>
              <p className="text-xs text-blue-300">{session.user?.email}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-800 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {/* Branch switcher — sliding indicator */}
            <div className="relative flex items-center bg-slate-100 rounded-lg p-1 gap-0">
              <div
                className="absolute inset-y-1 rounded-md transition-all duration-200"
                style={{
                  background: "#1c1c1e",
                  left: branch === "IKOT_EKPENE" ? 4 : "calc(50% + 2px)",
                  width: "calc(50% - 6px)",
                }}
              />
              {(["IKOT_EKPENE", "ITAM"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className="relative z-10 flex-1 px-3 py-1 rounded-md text-xs font-semibold transition-colors duration-200 whitespace-nowrap"
                  style={{ color: branch === b ? "#fff" : "#64748b" }}
                >
                  {b === "IKOT_EKPENE" ? "Ikot Ekpene" : "Itam"}
                </button>
              ))}
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full hover:bg-amber-200 transition-colors"
            >
              View Storefront →
            </Link>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
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
