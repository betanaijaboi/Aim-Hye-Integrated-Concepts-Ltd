"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AimHyeLogo } from "@/components/AimHyeLogo";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email: email || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setStep("otp");
    } else {
      setError(data.error || "Registration failed");
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/customer/register", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push("/account");
    } else {
      setError(data.error || "OTP verification failed");
    }
  }

  const inputStyle = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" };
  const labelStyle = { color: "rgba(255,255,255,0.5)" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1c1c1e" }}>
      {/* Red top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #e0302a, transparent)" }} />

      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="relative px-6 py-4 flex items-center">
          <Link href="/account/login" className="text-sm transition-colors z-10" style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
            ← Sign In
          </Link>
          <p className="absolute left-0 right-0 text-center font-semibold text-white pointer-events-none">Create Account</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-2xl mx-auto mb-4">
              <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-1" />
            </div>
            <AimHyeLogo className="h-7 w-auto text-white mx-auto" />
            <p className="text-sm mt-2" style={{ color: "#e0302a" }}>Customer Portal</p>
          </div>

          <div className="rounded-2xl shadow-2xl p-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-center text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              {step === "form" ? "Enter your details to get started" : "Enter the OTP sent to your phone"}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(224,48,42,0.15)", color: "#e0302a" }}>{error}</div>
            )}

            {step === "form" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={labelStyle}>Email Address (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <button type="submit" disabled={loading || !name.trim() || !phone.trim()}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ background: "#e0302a" }}>
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
                <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Already have an account?{" "}
                  <Link href="/account/login" className="font-medium hover:underline" style={{ color: "#e0302a" }}>Sign in</Link>
                </p>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={labelStyle}>6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full rounded-xl px-4 py-3 text-center text-xl tracking-widest focus:outline-none"
                    style={inputStyle}
                  />
                  <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>OTP sent to {phone} · valid for 10 minutes</p>
                </div>
                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ background: "#e0302a" }}>
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>
                <button type="button" onClick={() => setStep("form")}
                  className="w-full text-sm py-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Back
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
