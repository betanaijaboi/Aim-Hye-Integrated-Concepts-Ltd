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
  requestedBy: { name: string; email: string };
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

function ReviewModal({
  request,
  onClose,
  onDone,
}: {
  request: ChangeRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "">("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isStock = request.type === "STOCK_UPDATE";

  async function submit() {
    if (!decision) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/changes/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reviewNote: note }),
    });
    setLoading(false);
    if (res.ok) {
      onDone();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to submit");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">Review Request</h2>
          <p className="text-sm text-slate-400 mt-0.5">from {request.requestedBy.name}</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Product + change */}
          <div className="rounded-xl p-4" style={{ background: "#f5f5f7" }}>
            <p className="font-semibold text-slate-800">{request.product.name} <span className="font-normal text-slate-500">({request.product.size})</span></p>
            <p className="text-xs text-slate-400 mb-3">{request.product.sku} · {request.product.brewery.shortName}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-600 font-medium">
                {isStock ? `${request.currentValue} crates` : formatNaira(request.currentValue)}
              </span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-sm px-3 py-1 rounded-lg font-bold text-white" style={{ background: "#1c1c1e" }}>
                {isStock ? `${request.proposedValue} crates` : formatNaira(request.proposedValue)}
              </span>
              <span className="text-xs text-slate-400 ml-auto">{isStock ? "Stock" : "Price"}</span>
            </div>
          </div>

          {/* Manager reason */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Manager&apos;s Reason</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2.5">{request.reason}</p>
          </div>

          {/* Decision */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Your Decision</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDecision("APPROVED")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={decision === "APPROVED"
                  ? { background: "rgba(34,197,94,0.12)", borderColor: "#16a34a", color: "#15803d" }
                  : { background: "#fff", borderColor: "#e2e8f0", color: "#64748b" }}
              >
                Approve
              </button>
              <button
                onClick={() => setDecision("REJECTED")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={decision === "REJECTED"
                  ? { background: "rgba(224,48,42,0.1)", borderColor: "#e0302a", color: "#e0302a" }
                  : { background: "#fff", borderColor: "#e2e8f0", color: "#64748b" }}
              >
                Reject
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Note to Manager <span className="text-slate-300 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-slate-400"
              placeholder={decision === "REJECTED" ? "Tell the manager why it was rejected..." : "Any notes for the manager..."}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!decision || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: decision === "REJECTED" ? "#e0302a" : "#1c1c1e" }}
          >
            {loading ? "Saving..." : decision === "APPROVED" ? "Approve & Apply" : decision === "REJECTED" ? "Reject" : "Choose Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminChangesPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [reviewing, setReviewing] = useState<ChangeRequest | null>(null);

  async function load() {
    const r = await fetch("/api/admin/changes");
    if (r.ok) setRequests(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <>
      {reviewing && (
        <ReviewModal
          request={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => { setReviewing(null); load(); }}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800">Change Requests</h1>
            <p className="text-sm text-slate-400 mt-0.5">Stock updates and price changes submitted by managers</p>
          </div>
          {pendingCount > 0 && (
            <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#b45309" }}>
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={filter === f
                ? { background: "#1c1c1e", color: "#fff", borderColor: "#1c1c1e" }
                : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}
            >
              {f === "ALL" ? "All" : STATUS_STYLE[f].label}
              <span className="ml-1.5 opacity-60">{f === "ALL" ? requests.length : requests.filter((r) => r.status === f).length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1c1c1e", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-400 text-sm">No {filter.toLowerCase()} requests</p>
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{req.product.name} <span className="text-slate-400 font-normal">({req.product.size})</span></p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{isStock ? "Stock" : "Price"}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{req.product.sku} · {req.product.brewery.shortName}</p>
                        <p className="text-xs text-slate-500 mt-1">By <span className="font-medium">{req.requestedBy.name}</span> · {new Date(req.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>

                    {/* Change */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 font-medium border border-slate-200">
                        {isStock ? `${req.currentValue} crates` : formatNaira(req.currentValue)}
                      </span>
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-sm font-bold rounded-lg px-3 py-1.5" style={{ background: "#1c1c1e", color: "#fff" }}>
                        {isStock ? `${req.proposedValue} crates` : formatNaira(req.proposedValue)}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mb-3">{req.reason}</p>

                    {/* Review note */}
                    {req.reviewNote && (
                      <p className="text-xs rounded-xl px-3 py-2 mb-3" style={{ background: req.status === "APPROVED" ? "rgba(34,197,94,0.08)" : "rgba(224,48,42,0.08)", color: req.status === "APPROVED" ? "#166534" : "#b91c1c" }}>
                        <span className="font-semibold">{req.reviewedBy?.name}:</span> {req.reviewNote}
                      </p>
                    )}

                    {req.status === "PENDING" && (
                      <button
                        onClick={() => setReviewing(req)}
                        className="mt-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "#1c1c1e" }}
                      >
                        Review Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
