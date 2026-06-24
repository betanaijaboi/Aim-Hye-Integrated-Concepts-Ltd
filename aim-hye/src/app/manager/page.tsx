"use client";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  size: string;
  stockCrates: number;
  pricePerCrate: number;
  brewery: { shortName: string };
}

interface ChangeRequest {
  id: string;
  type: string;
  status: string;
  proposedValue: number;
  currentValue: number;
  reason: string;
  reviewNote?: string;
  createdAt: string;
  product: { name: string; size: string; brewery: { shortName: string } };
}

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: "rgba(251,191,36,0.12)", color: "#b45309", label: "Pending" },
  APPROVED: { bg: "rgba(34,197,94,0.12)",  color: "#15803d", label: "Approved" },
  REJECTED: { bg: "rgba(224,48,42,0.12)",  color: "#e0302a", label: "Rejected" },
};

export default function ManagerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recent, setRecent] = useState<ChangeRequest[]>([]);
  const [tab, setTab] = useState<"stock" | "price">("stock");

  // Form state
  const [productId, setProductId] = useState("");
  const [proposedValue, setProposedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?active=true").then((r) => r.json()).then(setProducts);
    loadRecent();
  }, []);

  async function loadRecent() {
    const r = await fetch("/api/manager/changes");
    if (r.ok) setRecent(await r.json());
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku} ${p.brewery.shortName}`.toLowerCase().includes(search.toLowerCase())
  );

  const selected = products.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!productId || !proposedValue || !reason) return;
    setSubmitting(true);
    const res = await fetch("/api/manager/changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: tab === "stock" ? "STOCK_UPDATE" : "PRICE_CHANGE",
        productId,
        proposedValue: parseFloat(proposedValue),
        reason,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Request submitted — waiting for admin approval." });
      setProductId(""); setProposedValue(""); setReason(""); setSearch("");
      loadRecent();
    } else {
      setMsg({ ok: false, text: data.error || "Submission failed" });
    }
  }

  const pendingCount = recent.filter((r) => r.status === "PENDING").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: recent.filter((r) => r.status === "PENDING").length, color: "#b45309" },
          { label: "Approved", value: recent.filter((r) => r.status === "APPROVED").length, color: "#15803d" },
          { label: "Rejected", value: recent.filter((r) => r.status === "REJECTED").length, color: "#e0302a" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ background: "rgba(251,191,36,0.12)", color: "#b45309" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting admin review
        </div>
      )}

      {/* Submit form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Submit a Change Request</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your request goes to admin for approval before taking effect</p>
        </div>

        {/* Type tabs */}
        <div className="flex border-b border-slate-100">
          {(["stock", "price"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setProductId(""); setProposedValue(""); setMsg(null); }}
              className="flex-1 py-3 text-sm font-semibold transition-all"
              style={tab === t ? { color: "#e0302a", borderBottom: "2px solid #e0302a" } : { color: "#94a3b8" }}
            >
              {t === "stock" ? "Stock Update" : "Price Change"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Product search + select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Product</label>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setProductId(""); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:border-slate-400"
            />
            {search && !productId && (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-slate-400 p-3">No products found</p>
                ) : (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProductId(p.id); setSearch(`${p.name} (${p.size}) — ${p.brewery.shortName}`); }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{p.name} <span className="text-slate-400">({p.size})</span></p>
                          <p className="text-xs text-slate-400">{p.sku} · {p.brewery.shortName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{p.stockCrates} crates</p>
                          <p className="text-xs text-slate-400">{formatNaira(p.pricePerCrate)}/crate</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Current value pill */}
            {selected && (
              <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#f5f5f7" }}>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Current {tab === "stock" ? "Stock" : "Price per Crate"}</p>
                  <p className="font-bold text-slate-800">
                    {tab === "stock" ? `${selected.stockCrates} crates` : formatNaira(selected.pricePerCrate)}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div>
                  <p className="text-xs text-slate-400">Proposed</p>
                  <p className="font-bold" style={{ color: "#e0302a" }}>
                    {proposedValue
                      ? tab === "stock"
                        ? `${proposedValue} crates`
                        : formatNaira(parseFloat(proposedValue) || 0)
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Proposed value */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              {tab === "stock" ? "New Stock (crates)" : "New Price per Crate (₦)"}
            </label>
            <input
              type="number"
              min="0"
              step={tab === "stock" ? "1" : "0.01"}
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
              placeholder={tab === "stock" ? "e.g. 120" : "e.g. 4500"}
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Reason for Change</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-slate-400"
              placeholder={tab === "stock"
                ? "e.g. Evening count after truck return — actual stock is 85 crates"
                : "e.g. Brewery increased price by ₦200 per crate effective Monday"}
            />
          </div>

          {msg && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: msg.ok ? "rgba(34,197,94,0.1)" : "rgba(224,48,42,0.1)", color: msg.ok ? "#15803d" : "#e0302a" }}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !productId}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
            style={{ background: "#e0302a" }}
          >
            {submitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </div>

      {/* Recent requests preview */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Recent Requests</h2>
            <a href="/manager/changes" className="text-xs font-medium" style={{ color: "#e0302a" }}>View all →</a>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.slice(0, 5).map((req) => {
              const s = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;
              return (
                <div key={req.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{req.product.name} <span className="text-slate-400 font-normal">({req.product.size})</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">{req.type === "STOCK_UPDATE" ? "Stock" : "Price"} · {new Date(req.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {req.type === "STOCK_UPDATE" ? `${req.currentValue}→${req.proposedValue} crates` : `${formatNaira(req.currentValue)}→${formatNaira(req.proposedValue)}`}
                    </p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
