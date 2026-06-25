"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AimHyeLogo } from "@/components/AimHyeLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#1c1c1e" }}>
      {/* Red top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #e0302a, transparent)" }} />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-2xl mx-auto mb-4">
            <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-1" />
          </div>
          <AimHyeLogo className="h-8 w-auto text-white mx-auto" />
          <p className="text-sm mt-2" style={{ color: "#e0302a" }}>Distribution Management System</p>
        </div>

        <div className="rounded-2xl shadow-2xl p-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className="text-lg font-semibold text-white mb-6">Admin Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                placeholder="admin@aimhye.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(224,48,42,0.15)", color: "#e0302a" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ background: "#e0302a" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-xs text-center mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>admin@aimhye.com · admin123</p>
        </div>
      </div>
    </div>
  );
}
