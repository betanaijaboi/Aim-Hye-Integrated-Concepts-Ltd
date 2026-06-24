"use client";
import { useEffect, useState } from "react";

interface ChangeRequest {
  id: string;
  type: string;
  status: string;
  proposedValue: number;
  currentValue: number;
  reason: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  product: { name: string; sku: string; size: string; brewery: { shortName: string } };
  reviewedBy?: { name: string };
}

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: "rgba(251,191,36,0.12)", color: "#b45309", label: "Pending" },
  APPROVED: { bg: "rgba(34,197,94,0.12)",  color: "#15803d", label: "Approved" },
  REJECTED: { bg: "rgba(224,48,42,0.12)",  color: "#e0302a", label: "Rejected" },
};

export default function ManagerChangesPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    fetch("/api/manager/changes")
      .then((r) => r.json())
      .then((d) => { setRequests(d); setLoading(false); });
  }, []);

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
            style={filter === f
              ? { background: "#1c1c1e", color: "#fff", borderColor: "#1c1c1e" }
              : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}
          >
            {f === "ALL" ? "All" : STATUS_STYLE[f].label}
            {f !== "ALL" && (
              <span className="ml-1.5 opacity-60">{requests.filter((r) => r.status === f).length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1c1c1e", borderTopColor: "transparent" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-sm">No requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const s = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;
            const isStock = req.type === "STOCK_UPDATE";
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{req.product.name} <span className="text-slate-400 font-normal text-sm">({req.product.size})</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">{req.product.sku} · {req.product.brewery.shortName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">
                        {isStock ? "Stock Update" : "Price Change"}
                      </span>
                    </div>
                  </div>

                  {/* Change value */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-slate-600">
                      {isStock ? `${req.currentValue} crates` : formatNaira(req.currentValue)}
                    </span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-sm font-bold" style={{ color: "#e0302a" }}>
                      {isStock ? `${req.proposedValue} crates` : formatNaira(req.proposedValue)}
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: "#f5f5f7" }}>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Your Reason</p>
                    <p className="text-sm text-slate-700">{req.reason}</p>
                  </div>

                  {/* Review note */}
                  {req.reviewNote && (
                    <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: req.status === "APPROVED" ? "rgba(34,197,94,0.08)" : "rgba(224,48,42,0.08)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: req.status === "APPROVED" ? "#15803d" : "#e0302a" }}>
                        Admin Note {req.reviewedBy ? `· ${req.reviewedBy.name}` : ""}
                      </p>
                      <p className="text-sm" style={{ color: req.status === "APPROVED" ? "#166534" : "#b91c1c" }}>{req.reviewNote}</p>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400">
                    Submitted {new Date(req.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {req.reviewedAt && ` · Reviewed ${new Date(req.reviewedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
