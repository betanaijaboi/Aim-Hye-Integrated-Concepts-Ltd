"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#1e3a5f] text-white py-4 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/account/login" className="text-blue-300 hover:text-white text-sm">← Sign In</Link>
          <p className="font-semibold">Create Account</p>
          <div />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#1e3a5f] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800">Create Your Account</h1>
              <p className="text-slate-500 text-sm mt-1">
                {step === "form" ? "Enter your details to get started" : "Enter the OTP sent to your phone"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {step === "form" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !phone.trim()}
                  className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/account/login" className="text-[#1e3a5f] font-medium hover:underline">Sign in</Link>
                </p>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-xl tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">OTP sent to {phone} · valid for 10 minutes</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>
                <button type="button" onClick={() => setStep("form")} className="w-full text-sm text-slate-500 hover:text-slate-700">
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
