"use client";
import { useState, useEffect, useCallback } from "react";

interface Payment {
  id: string;
  method: string;
  status: string;
  amount: number;
  reference: string;
  paystackRef?: string;
  createdAt: string;
  verifiedAt?: string;
  order: {
    orderNo: string;
    customer: { name: string; phone: string };
    totalAmount: number;
    depositAmount: number;
  };
}

const METHOD_LABELS: Record<string, string> = {
  PAYSTACK_CARD: "Card (Paystack)",
  PAYSTACK_TRANSFER: "Bank Transfer (Paystack)",
  BANK_TRANSFER: "Direct Bank Transfer",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SUCCESS: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "SUCCESS" | "FAILED">("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (methodFilter !== "ALL") params.set("method", methodFilter);
    const res = await fetch(`/api/admin/payments?${params}`);
    const data = await res.json();
    setPayments(data.payments || []);
    setLoading(false);
  }, [filter, methodFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleVerifyPaystack(paymentId: string, paystackRef: string) {
    setVerifying(true);
    setMsg("");
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: paystackRef, paymentId }),
    });
    const data = await res.json();
    setVerifying(false);
    if (res.ok) {
      setMsg("Payment verified successfully!");
      load();
      setSelected(null);
    } else {
      setMsg(data.error || "Verification failed");
    }
  }

  async function handleMarkPaid(paymentId: string) {
    setVerifying(true);
    setMsg("");
    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SUCCESS" }),
    });
    setVerifying(false);
    if (res.ok) {
      setMsg("Payment marked as paid!");
      load();
      setSelected(null);
    } else {
      setMsg("Failed to update payment");
    }
  }

  const filtered = payments.filter((p) => {
    if (filter !== "ALL" && p.status !== filter) return false;
    if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
    return true;
  });

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const totalPaid = payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and verify customer payments</p>
        </div>
        <button onClick={load} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatNaira(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">All Transactions</p>
          <p className="text-2xl font-bold text-slate-800">{payments.length}</p>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${msg.includes("success") || msg.includes("paid") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["ALL", "PENDING", "SUCCESS", "FAILED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700"
        >
          <option value="ALL">All Methods</option>
          <option value="PAYSTACK_CARD">Card (Paystack)</option>
          <option value="PAYSTACK_TRANSFER">Transfer (Paystack)</option>
          <option value="BANK_TRANSFER">Direct Transfer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No payments found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-sm">{p.order.customer.name}</p>
                    <p className="text-xs text-slate-400">{p.order.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{p.order.orderNo}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{METHOD_LABELS[p.method] || p.method}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatNaira(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-600"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString("en-NG")}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelected(p); setMsg(""); }}
                      className="text-xs text-[#1e3a5f] hover:underline font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 text-lg">Payment Details</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium">{selected.order.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium">{selected.order.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order No.</span>
                <span className="font-medium">{selected.order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-slate-800">{formatNaira(selected.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium">{METHOD_LABELS[selected.method] || selected.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono text-xs">{selected.reference}</span>
              </div>
              {selected.paystackRef && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Paystack Ref</span>
                  <span className="font-mono text-xs">{selected.paystackRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status] || "bg-slate-100 text-slate-600"}`}>{selected.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span>{new Date(selected.createdAt).toLocaleString("en-NG")}</span>
              </div>
              {selected.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified At</span>
                  <span>{new Date(selected.verifiedAt).toLocaleString("en-NG")}</span>
                </div>
              )}
            </div>

            {msg && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${msg.includes("success") || msg.includes("paid") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>
            )}

            {selected.status === "PENDING" && (
              <div className="mt-5 space-y-2">
                {selected.paystackRef && (
                  <button
                    onClick={() => handleVerifyPaystack(selected.id, selected.paystackRef!)}
                    disabled={verifying}
                    className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Verify with Paystack"}
                  </button>
                )}
                {selected.method === "BANK_TRANSFER" && (
                  <button
                    onClick={() => handleMarkPaid(selected.id)}
                    disabled={verifying}
                    className="w-full bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    {verifying ? "Updating..." : "Mark as Paid (Bank Transfer Confirmed)"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
