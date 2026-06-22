"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  hasPin: boolean;
  hasBiometric: boolean;
  twoFaEnabled: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { name: string; sku: string; size: string; packaging: string };
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: { status: string; method: string } | null;
}

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

const STEPS = [
  { key: "PENDING",    label: "Order Placed",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "CONFIRMED",  label: "Confirmed",      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "DISPATCHED", label: "On the Way",     icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" },
  { key: "DELIVERED",  label: "Delivered",      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
];

function getStepIndex(status: string) {
  return STEPS.findIndex((s) => s.key === status);
}

function ActiveOrderTracker({ order }: { order: Order }) {
  const stepIdx = getStepIndex(order.status);

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#1c1c1e" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-bold text-base">Active Order</p>
          <span className="text-xs font-mono text-white/40">{order.orderNo}</span>
        </div>
        <p className="text-white/50 text-xs mb-5">
          {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* Step tracker */}
        <div className="relative flex items-start justify-between mb-6">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 z-0" />
          <div
            className="absolute top-5 left-0 h-0.5 z-0 transition-all duration-700"
            style={{
              background: "#e0302a",
              width: stepIdx <= 0 ? "0%" : `${(stepIdx / (STEPS.length - 1)) * 100}%`,
            }}
          />

          {STEPS.map((step, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={step.key} className="flex flex-col items-center z-10" style={{ width: `${100 / STEPS.length}%` }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300"
                  style={{
                    background: done || active ? "#e0302a" : "rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 0 0 4px rgba(224,48,42,0.25)" : "none",
                  }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                  </svg>
                </div>
                <p className={`text-center text-[10px] leading-tight font-medium ${active ? "text-white" : done ? "text-white/60" : "text-white/30"}`}>
                  {step.label}
                </p>
                {active && (
                  <span className="mt-1 text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#e0302a", color: "#fff" }}>
                    NOW
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Items summary */}
        <div className="border-t border-white/10 pt-4 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">×{item.quantity}</span>
                <p className="text-white/80 text-sm">{item.product.name} <span className="text-white/40 text-xs">({item.product.size})</span></p>
              </div>
              <p className="text-white/60 text-xs">{formatNaira(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {/* Total & delivery */}
        <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs">Delivery to</p>
            <p className="text-white/70 text-xs mt-0.5 max-w-[200px] truncate">{order.deliveryAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs">Total</p>
            <p className="text-white font-bold">{formatNaira(order.totalAmount + order.depositAmount)}</p>
          </div>
        </div>
      </div>

      {/* Payment banner */}
      {order.payment?.status !== "SUCCESS" && (
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(224,48,42,0.15)" }}>
          <p className="text-xs" style={{ color: "#e0302a" }}>Payment pending</p>
          <a href={`/api/invoices?orderId=${order.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-white/70 hover:text-white">
            View Invoice →
          </a>
        </div>
      )}
    </div>
  );
}

function OrderHistoryCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  const isPaid = order.payment?.status === "SUCCESS";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-800 text-sm">{order.orderNo}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
              {order.items.map((i) => i.product.name).slice(0, 2).join(", ")}
              {order.items.length > 2 ? ` +${order.items.length - 2} more` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-4">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: isCancelled ? "#fee2e2" : order.status === "DELIVERED" ? "#dcfce7" : "#f1f5f9",
                color: isCancelled ? "#dc2626" : order.status === "DELIVERED" ? "#16a34a" : "#475569",
              }}
            >
              {order.status === "DISPATCHED" ? "On the Way" : order.status.charAt(0) + order.status.slice(1).toLowerCase()}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
              {isPaid ? "Paid" : "Unpaid"}
            </span>
            <p className="text-sm font-bold text-slate-800 mt-1">{formatNaira(order.totalAmount + order.depositAmount)}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <p className="text-xs text-slate-400">{expanded ? "Hide details" : "Show items"}</p>
          <svg className={`w-3 h-3 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <div className="pt-3 space-y-2 mb-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1c1c1e" }}>
                    {item.quantity}
                  </span>
                  <div>
                    <p className="text-slate-700 font-medium text-xs">{item.product.name}</p>
                    <p className="text-slate-400 text-[10px]">{item.product.size} · {item.product.packaging}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs">{formatNaira(item.subtotal)}</p>
              </div>
            ))}
          </div>
          {order.depositAmount > 0 && (
            <p className="text-xs text-slate-400 mb-3">Incl. {formatNaira(order.depositAmount)} bottle deposit</p>
          )}
          <div className="flex items-center gap-2">
            <a
              href={`/api/invoices?orderId=${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-medium py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Download Invoice
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "security" | "profile">("orders");

  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => {
        if (r.status === 401) { router.push("/account/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setCustomer(data.customer);
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/customer/login", { method: "DELETE" });
    router.push("/account/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f7" }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1c1c1e", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!customer) return null;

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const historyOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: "rgba(28,28,30,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-0.5" />
            </div>
            <span className="text-white font-bold text-sm">AIM-HYE</span>
          </Link>
          <p className="text-white font-semibold text-sm">My Account</p>
          <button onClick={handleLogout} className="text-white/50 hover:text-white text-sm transition-colors">Sign Out</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-black flex-shrink-0" style={{ background: "#1c1c1e" }}>
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">{customer.name}</h1>
            <p className="text-slate-400 text-sm">{customer.phone}</p>
            {customer.email && <p className="text-slate-300 text-xs">{customer.email}</p>}
          </div>
          <div className="flex flex-col gap-1 items-end">
            {customer.hasPin && (
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">PIN Set</span>
            )}
            {customer.hasBiometric && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Biometric</span>
            )}
          </div>
        </div>

        {/* Active order tracker — shown outside tabs, always visible */}
        {activeOrders.length > 0 && activeOrders.map((order) => (
          <ActiveOrderTracker key={order.id} order={order} />
        ))}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 shadow-sm border border-slate-100">
          {(["orders", "security", "profile"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={tab === t ? { background: "#1c1c1e", color: "#fff" } : { color: "#64748b" }}
            >
              {t === "orders" ? "History" : t === "security" ? "Security" : "Profile"}
            </button>
          ))}
        </div>

        {/* Order history tab */}
        {tab === "orders" && (
          <div className="space-y-3">
            {historyOrders.length === 0 && activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#f5f5f7" }}>
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-700">No orders yet</p>
                <p className="text-slate-400 text-sm mt-1">Browse our products and place your first order</p>
                <Link href="/" className="mt-4 inline-block text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors" style={{ background: "#e0302a" }}>
                  Shop Now
                </Link>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
                <p className="text-slate-400 text-sm">No completed orders yet — your history will appear here once orders are delivered.</p>
              </div>
            ) : (
              historyOrders.map((order) => (
                <OrderHistoryCard key={order.id} order={order} />
              ))
            )}
          </div>
        )}

        {/* Security tab */}
        {tab === "security" && <SecurityTab customer={customer} onUpdate={(c) => setCustomer(c)} />}

        {/* Profile tab */}
        {tab === "profile" && <ProfileTab customer={customer} />}
      </div>
    </div>
  );
}

function SecurityTab({ customer, onUpdate }: { customer: Customer; onUpdate: (c: Customer) => void }) {
  const [pinMode, setPinMode] = useState<"idle" | "set" | "change">("idle");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState("");
  const [biometricLoading, setBiometricLoading] = useState(false);

  async function handleSetPin() {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) { setPinMsg("PIN must be 4 digits"); return; }
    if (pin !== confirmPin) { setPinMsg("PINs do not match"); return; }
    setPinLoading(true);
    const res = await fetch("/api/customer/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, currentPin: pinMode === "change" ? currentPin : undefined }),
    });
    const data = await res.json();
    setPinLoading(false);
    if (res.ok) {
      setPinMsg("PIN set successfully!");
      setPinMode("idle");
      setPin(""); setConfirmPin(""); setCurrentPin("");
      onUpdate({ ...customer, hasPin: true });
    } else {
      setPinMsg(data.error || "Failed to set PIN");
    }
  }

  async function handleRegisterBiometric() {
    setBiometricLoading(true);
    setBiometricMsg("");
    try {
      const optRes = await fetch("/api/customer/webauthn/register", { method: "GET" });
      const { options } = await optRes.json();
      const { startRegistration } = await import("@simplewebauthn/browser");
      const attResp = await startRegistration({ optionsJSON: options });
      const verRes = await fetch("/api/customer/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attestation: attResp }),
      });
      const verData = await verRes.json();
      if (verRes.ok) {
        setBiometricMsg("Biometric registered successfully!");
        onUpdate({ ...customer, hasBiometric: true });
      } else {
        setBiometricMsg(verData.error || "Registration failed");
      }
    } catch (e: unknown) {
      setBiometricMsg(e instanceof Error ? e.message : "Registration failed or cancelled");
    }
    setBiometricLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f5f5f7" }}>
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Transaction PIN</h3>
            <p className="text-xs text-slate-400">Required to pay with saved cards</p>
          </div>
          {customer.hasPin && <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
        </div>

        {pinMode === "idle" ? (
          <button
            onClick={() => setPinMode(customer.hasPin ? "change" : "set")}
            className="text-sm text-white px-4 py-2 rounded-xl transition-colors"
            style={{ background: "#1c1c1e" }}
          >
            {customer.hasPin ? "Change PIN" : "Set PIN"}
          </button>
        ) : (
          <div className="space-y-3">
            {pinMode === "change" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Current PIN</label>
                <input type="password" maxLength={4} inputMode="numeric" value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:border-slate-400"
                  placeholder="••••" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">New PIN (4 digits)</label>
              <input type="password" maxLength={4} inputMode="numeric" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:border-slate-400"
                placeholder="••••" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Confirm PIN</label>
              <input type="password" maxLength={4} inputMode="numeric" value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:border-slate-400"
                placeholder="••••" />
            </div>
            {pinMsg && <p className={`text-xs ${pinMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>{pinMsg}</p>}
            <div className="flex gap-2">
              <button onClick={handleSetPin} disabled={pinLoading}
                className="text-sm text-white px-4 py-2 rounded-xl disabled:opacity-50"
                style={{ background: "#1c1c1e" }}>
                {pinLoading ? "Saving..." : "Save PIN"}
              </button>
              <button onClick={() => { setPinMode("idle"); setPinMsg(""); setPin(""); setConfirmPin(""); setCurrentPin(""); }}
                className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f5f5f7" }}>
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Biometric / Passkey</h3>
            <p className="text-xs text-slate-400">Fingerprint, Face ID, or Windows Hello</p>
          </div>
          {customer.hasBiometric && <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
        </div>
        <button onClick={handleRegisterBiometric} disabled={biometricLoading}
          className="text-sm text-white px-4 py-2 rounded-xl disabled:opacity-50"
          style={{ background: "#1c1c1e" }}>
          {biometricLoading ? "Registering..." : customer.hasBiometric ? "Add Another Device" : "Register Biometric"}
        </button>
        {biometricMsg && <p className={`text-xs mt-2 ${biometricMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>{biometricMsg}</p>}
        <p className="text-xs text-slate-400 mt-2">Device must support biometric auth (Touch ID, Face ID, Windows Hello)</p>
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: "rgba(224,48,42,0.06)", borderColor: "rgba(224,48,42,0.2)" }}>
        <h3 className="font-semibold text-slate-800 mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-slate-500">OTP verification via SMS is active on your account for all logins.</p>
      </div>
    </div>
  );
}

function ProfileTab({ customer }: { customer: Customer }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-slate-800">Account Details</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-400 text-xs mb-1">Full Name</p>
          <p className="font-medium text-slate-800">{customer.name}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Phone Number</p>
          <p className="font-medium text-slate-800">{customer.phone}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Email Address</p>
          <p className="font-medium text-slate-800">{customer.email || "Not provided"}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Account ID</p>
          <p className="font-medium text-slate-800 text-xs font-mono">{customer.id.slice(0, 16)}…</p>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">To update your profile details, contact us directly.</p>
      </div>
    </div>
  );
}
