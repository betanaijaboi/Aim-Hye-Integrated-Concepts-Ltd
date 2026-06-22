"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "phone" | "otp" | "pin" | "biometric";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setHasPin(data.hasPin);
      setHasBiometric(data.hasBiometric);
      setStep("otp");
    } else {
      setError(data.error || "Failed to send OTP");
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/customer/login", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      // OTP verified — proceed to PIN or biometric if set, else done
      if (data.hasPin || data.hasBiometric) {
        if (data.hasBiometric) setStep("biometric");
        else setStep("pin");
      } else {
        router.push("/account");
      }
    } else {
      setError(data.error || "Invalid OTP");
    }
  }

  async function handlePinLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 4) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/customer/pin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/account");
    } else {
      const data = await res.json();
      setError(data.error || "Incorrect PIN");
    }
  }

  async function handleBiometricLogin() {
    setLoading(true);
    setError("");
    try {
      const optRes = await fetch("/api/customer/webauthn/authenticate?phone=" + encodeURIComponent(phone));
      const { options } = await optRes.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const authResp = await startAuthentication({ optionsJSON: options });
      const verRes = await fetch("/api/customer/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, assertion: authResp }),
      });
      setLoading(false);
      if (verRes.ok) {
        router.push("/account");
      } else {
        const data = await verRes.json();
        setError(data.error || "Biometric authentication failed");
        setStep("pin");
      }
    } catch {
      setLoading(false);
      setError("Biometric authentication cancelled — use PIN instead");
      if (hasPin) setStep("pin");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#1e3a5f] text-white py-4 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-blue-300 hover:text-white text-sm">← Back to Store</Link>
          <p className="font-semibold">Sign In</p>
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
              <h1 className="text-xl font-bold text-slate-800">Aim-Hye Store</h1>
              <p className="text-slate-500 text-sm mt-1">
                {step === "phone" && "Enter your phone number to continue"}
                {step === "otp" && "Enter the OTP sent to your phone"}
                {step === "pin" && "Enter your transaction PIN"}
                {step === "biometric" && "Verify with biometrics"}
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {["phone", "otp", ...(hasPin || hasBiometric ? ["verify"] : [])].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    (step === "phone" && i === 0) || (step === "otp" && i === 1) || ((step === "pin" || step === "biometric") && i === 2)
                      ? "bg-[#1e3a5f] text-white" : "bg-slate-200 text-slate-500"
                  }`}>{i + 1}</div>
                  {i < (hasPin || hasBiometric ? 2 : 1) && <div className="w-8 h-0.5 bg-slate-200" />}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {/* Phone step */}
            {step === "phone" && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !phone.trim()}
                  className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
                <p className="text-center text-sm text-slate-500">
                  New customer?{" "}
                  <Link href="/account/register" className="text-[#1e3a5f] font-medium hover:underline">Create account</Link>
                </p>
              </form>
            )}

            {/* OTP step */}
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
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-slate-500 hover:text-slate-700">
                  Back
                </button>
              </form>
            )}

            {/* PIN step */}
            {step === "pin" && (
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transaction PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || pin.length < 4}
                  className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Confirm PIN"}
                </button>
              </form>
            )}

            {/* Biometric step */}
            {step === "biometric" && (
              <div className="space-y-4">
                <button
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  {loading ? "Authenticating..." : "Use Fingerprint / Face ID"}
                </button>
                {hasPin && (
                  <button onClick={() => setStep("pin")} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2">
                    Use PIN instead
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
