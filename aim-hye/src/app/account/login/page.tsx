"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

  const stepLabel = step === "phone" ? "Enter your phone number to continue"
    : step === "otp" ? "Enter the OTP sent to your phone"
    : step === "pin" ? "Enter your transaction PIN"
    : "Verify with biometrics";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1c1c1e" }}>
      {/* Red top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #e0302a, transparent)" }} />

      {/* Header */}
      <header className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="relative px-6 py-4 flex items-center">
          <Link href="/" className="text-sm transition-colors z-10" style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
            ← Back to Store
          </Link>
          <p className="absolute left-0 right-0 text-center font-semibold text-white pointer-events-none">Sign In</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative mx-auto mb-2" style={{ height: "80px", width: "107px" }}>
              <Image src="/uploads/aimhye-symbol.png" alt="Aim-Hye" fill className="object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <p className="text-sm mt-2" style={{ color: "#e0302a" }}>Customer Portal</p>
          </div>

          <div className="rounded-2xl shadow-2xl p-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-center text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{stepLabel}</p>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {["phone", "otp", ...(hasPin || hasBiometric ? ["verify"] : [])].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={(step === "phone" && i === 0) || (step === "otp" && i === 1) || ((step === "pin" || step === "biometric") && i === 2)
                      ? { background: "#e0302a", color: "#fff" }
                      : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                    {i + 1}
                  </div>
                  {i < (hasPin || hasBiometric ? 2 : 1) && <div className="w-8 h-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(224,48,42,0.15)", color: "#e0302a" }}>{error}</div>
            )}

            {/* Phone step */}
            {step === "phone" && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                </div>
                <button type="submit" disabled={loading || !phone.trim()}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ background: "#e0302a" }}>
                  {loading ? "Sending..." : "Send OTP"}
                </button>
                <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  New customer?{" "}
                  <Link href="/account/register" className="font-medium hover:underline" style={{ color: "#e0302a" }}>Create account</Link>
                </p>
              </form>
            )}

            {/* OTP step */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full rounded-xl px-4 py-3 text-center text-xl tracking-widest focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                  <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>OTP sent to {phone} · valid for 10 minutes</p>
                </div>
                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ background: "#e0302a" }}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button type="button" onClick={() => setStep("phone")}
                  className="w-full text-sm py-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Back
                </button>
              </form>
            )}

            {/* PIN step */}
            {step === "pin" && (
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Transaction PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-full rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                </div>
                <button type="submit" disabled={loading || pin.length < 4}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ background: "#e0302a" }}>
                  {loading ? "Verifying..." : "Confirm PIN"}
                </button>
              </form>
            )}

            {/* Biometric step */}
            {step === "biometric" && (
              <div className="space-y-4">
                <button onClick={handleBiometricLogin} disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
                  style={{ background: "#e0302a" }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  {loading ? "Authenticating..." : "Use Fingerprint / Face ID"}
                </button>
                {hasPin && (
                  <button onClick={() => setStep("pin")} className="w-full text-sm py-2"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
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
