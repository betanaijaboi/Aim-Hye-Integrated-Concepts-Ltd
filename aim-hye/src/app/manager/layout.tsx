"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/manager", label: "Dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { href: "/manager/changes", label: "My Requests", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

interface ManagerInfo { name: string; branch?: string }

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/manager/login") { setChecking(false); return; }
    fetch("/api/manager/me")
      .then((r) => {
        if (r.status === 401) { router.push("/manager/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setManager(d); setChecking(false); });
  }, [router, pathname]);

  if (pathname === "/manager/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f7" }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1c1c1e", borderTopColor: "transparent" }} />
      </div>
    );
  }

  async function handleLogout() {
    await fetch("/api/manager/login", { method: "DELETE" });
    router.push("/manager/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f5f5f7" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: "#1c1c1e" }}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white flex-shrink-0">
            <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-0.5" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">AIM-HYE</p>
            <p className="text-[11px] leading-tight" style={{ color: "#e0302a" }}>Manager Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active ? { background: "#e0302a", color: "#fff" } : { color: "rgba(255,255,255,0.6)" }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          {manager && (
            <div className="mb-3">
              <p className="text-white/70 text-xs truncate font-medium">{manager.name}</p>
              {manager.branch && (
                <p className="text-[10px] mt-0.5" style={{ color: "#e0302a" }}>
                  {manager.branch === "IKOT_EKPENE" ? "Ikot Ekpene Branch" : "Itam Branch"}
                </p>
              )}
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3 flex-shrink-0">
          <p className="text-slate-800 font-semibold text-sm">
            {NAV.find((n) => n.href === pathname)?.label ?? "Manager"}
          </p>
          <span className="ml-auto text-xs text-slate-400">
            {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
