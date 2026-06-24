"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/manager/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push("/manager");
    } else {
      setError(data.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f5f5f7" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg mb-4">
            <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-1" />
          </div>
          <p className="text-3xl tracking-wide" style={{ color: "#1c1c1e", fontFamily: "var(--font-bebas)" }}>AIM-HYE</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#e0302a" }}>Manager Portal</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              placeholder="manager@aimhye.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-700" style={{ background: "rgba(224,48,42,0.08)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
            style={{ background: "#1c1c1e" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-4">Manager access only · Contact admin if locked out</p>
      </div>
    </div>
  );
}
