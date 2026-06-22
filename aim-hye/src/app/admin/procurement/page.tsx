"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product { id: string; name: string; size: string; sku: string; stockCrates: number; pricePerCrate: number }
interface Brewery { id: string; name: string; shortName: string }
interface POItem { id: string; productId: string; product: Product; quantityOrdered: number; unitCost: number; totalCost: number }
interface GRItem { productId: string; product: Product; quantityOrdered: number; quantityReceived: number; quantityShortfall: number }
interface GoodsReceipt { id: string; receiptNumber: string; receivedAt: string; isPartial: boolean; notes?: string; receivedBy: { name: string }; items: GRItem[] }
interface Payment { amountPaid: number; bankName?: string; transferRef?: string; paidAt: string; paidBy: { name: string }; notes?: string }
interface PO {
  id: string; poNumber: string; status: string;
  brewery: Brewery; raisedBy: { name: string; role: string }; approvedBy?: { name: string };
  items: POItem[]; payment?: Payment; receipts: GoodsReceipt[];
  notes?: string; expectedAt?: string; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; step: number }> = {
  DRAFT:              { label: "Draft",             color: "bg-slate-100 text-slate-600",   step: 0 },
  PENDING_APPROVAL:   { label: "Pending Approval",  color: "bg-amber-100 text-amber-800",   step: 1 },
  APPROVED:           { label: "Approved",          color: "bg-blue-100 text-blue-800",     step: 2 },
  PAID:               { label: "Paid",              color: "bg-indigo-100 text-indigo-800", step: 3 },
  PARTIALLY_RECEIVED: { label: "Part. Received",    color: "bg-orange-100 text-orange-800", step: 4 },
  RECEIVED:           { label: "Fully Received",    color: "bg-green-100 text-green-800",   step: 5 },
  CLOSED:             { label: "Closed",            color: "bg-slate-100 text-slate-500",   step: 6 },
  CANCELLED:          { label: "Cancelled",         color: "bg-red-100 text-red-700",       step: -1 },
};

function fmt(n: number) { return "₦" + n.toLocaleString("en-NG"); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }); }

// ─── Raise PO Modal ───────────────────────────────────────────────────────────
function RaisePOModal({ breweries, products, onClose, onCreated }: {
  breweries: Brewery[]; products: Product[];
  onClose: () => void; onCreated: () => void;
}) {
  const [breweryId, setBreweryId] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: "", quantity: 1, unitCost: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const breweryProducts = breweryId ? products.filter((p) => {
    // match via product's breweryId — we need to look at the products list
    return p.id; // all products if no filter on this side; actual filtering by breweryId on products
  }) : [];

  // Get products for selected brewery
  const [bProducts, setBProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!breweryId) { setBProducts([]); return; }
    fetch(`/api/products?breweryId=${breweryId}&active=true`)
      .then((r) => r.json()).then(setBProducts);
  }, [breweryId]);

  function addRow() { setRows((r) => [...r, { productId: "", quantity: 1, unitCost: 0 }]); }
  function removeRow(i: number) { setRows((r) => r.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: string, val: string | number) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }

  const totalValue = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!breweryId) { setError("Select a brewery"); return; }
    const validRows = rows.filter((r) => r.productId && r.quantity > 0);
    if (!validRows.length) { setError("Add at least one product"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/procurement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        breweryId,
        notes,
        expectedAt: expectedAt || undefined,
        items: validRows.map((r) => ({ productId: r.productId, quantityOrdered: r.quantity, unitCost: r.unitCost })),
      }),
    });
    setLoading(false);
    if (res.ok) { onCreated(); onClose(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Raise Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brewery *</label>
              <select value={breweryId} onChange={(e) => { setBreweryId(e.target.value); setRows([{ productId: "", quantity: 1, unitCost: 0 }]); }}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm">
                <option value="">Select brewery…</option>
                {breweries.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery</label>
              <input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Products *</label>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select value={row.productId} onChange={(e) => {
                      const p = bProducts.find((p) => p.id === e.target.value);
                      updateRow(i, "productId", e.target.value);
                      if (p) updateRow(i, "unitCost", +(p.pricePerCrate * 0.85).toFixed(2));
                    }}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                      disabled={!breweryId}>
                      <option value="">Select product…</option>
                      {bProducts.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.size})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min={1} value={row.quantity}
                      onChange={(e) => updateRow(i, "quantity", +e.target.value)}
                      placeholder="Qty (crates)"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-center" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min={0} step={0.01} value={row.unitCost}
                      onChange={(e) => updateRow(i, "unitCost", +e.target.value)}
                      placeholder="Cost/crate"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div className="col-span-1 text-right text-xs text-slate-500 font-medium">
                    {fmt(row.quantity * row.unitCost)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add product
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Any instructions for this order…"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Total Order Value</span>
            <span className="text-xl font-bold text-[#1e3a5f]">{fmt(totalValue)}</span>
          </div>
        </form>
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={loading}
            className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
            {loading ? "Submitting…" : "Submit PO for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ po, onClose, onDone }: { po: PO; onClose: () => void; onDone: () => void }) {
  const totalCost = po.items.reduce((s, i) => s + i.totalCost, 0);
  const [amountPaid, setAmountPaid] = useState(String(totalCost.toFixed(2)));
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!amountPaid || !paidAt) { setError("Amount and date are required"); return; }
    setLoading(true); setError("");
    const res = await fetch(`/api/procurement/${po.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", amountPaid: +amountPaid, bankName, accountName, transferRef, paidAt, notes }),
    });
    setLoading(false);
    if (res.ok) { onDone(); onClose(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800 text-lg">Record Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm">
          <p className="text-slate-500">PO: <span className="font-semibold text-slate-800">{po.poNumber}</span></p>
          <p className="text-slate-500">Brewery: <span className="font-medium text-slate-700">{po.brewery.name}</span></p>
          <p className="text-slate-500">Order Total: <span className="font-bold text-[#1e3a5f]">{fmt(totalCost)}</span></p>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

        <div className="space-y-3">
          {[
            { label: "Amount Paid (₦) *", value: amountPaid, set: setAmountPaid, type: "number" },
            { label: "Payment Date *", value: paidAt, set: setPaidAt, type: "date" },
            { label: "Bank Name", value: bankName, set: setBankName, type: "text" },
            { label: "Account Name / Beneficiary", value: accountName, set: setAccountName, type: "text" },
            { label: "Transfer Reference / Teller No.", value: transferRef, set: setTransferRef, type: "text" },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
              <input type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? "Saving…" : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Delivery Modal ────────────────────────────────────────────────────
function ReceiveModal({ po, onClose, onDone }: { po: PO; onClose: () => void; onDone: () => void }) {
  // Compute remaining qty per product
  const received = new Map<string, number>();
  for (const r of po.receipts) {
    for (const ri of r.items) {
      received.set(ri.productId, (received.get(ri.productId) || 0) + ri.quantityReceived);
    }
  }

  const [rows, setRows] = useState(
    po.items
      .filter((i) => (received.get(i.productId) || 0) < i.quantityOrdered)
      .map((i) => ({
        productId: i.productId,
        productName: `${i.product.name} (${i.product.size})`,
        quantityOrdered: i.quantityOrdered,
        alreadyReceived: received.get(i.productId) || 0,
        quantityReceived: i.quantityOrdered - (received.get(i.productId) || 0),
      }))
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true); setError("");
    const res = await fetch(`/api/procurement/${po.id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes,
        items: rows.map((r) => ({ productId: r.productId, quantityReceived: r.quantityReceived })),
      }),
    });
    setLoading(false);
    if (res.ok) { onDone(); onClose(); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg">Record Delivery</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Enter the actual crates received. If fewer than ordered, leave the correct number — the shortfall is tracked automatically.
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

          <div className="space-y-3">
            {rows.map((row, i) => {
              const remaining = row.quantityOrdered - row.alreadyReceived;
              const shortfall = remaining - row.quantityReceived;
              return (
                <div key={row.productId} className="bg-slate-50 rounded-xl p-4">
                  <p className="font-medium text-slate-800 text-sm mb-2">{row.productName}</p>
                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 mb-2">
                    <div>Ordered: <span className="font-bold text-slate-700">{row.quantityOrdered}</span></div>
                    <div>Already in: <span className="font-bold text-slate-700">{row.alreadyReceived}</span></div>
                    <div>Remaining: <span className="font-bold text-slate-700">{remaining}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-600">Crates received now:</label>
                    <input type="number" min={0} max={remaining}
                      value={row.quantityReceived}
                      onChange={(e) => setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, quantityReceived: Math.min(+e.target.value, remaining) } : r))}
                      className="w-24 border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-center font-bold" />
                    {shortfall > 0 && (
                      <span className="text-xs text-orange-600 font-medium">⚠ {shortfall} short</span>
                    )}
                    {shortfall === 0 && (
                      <span className="text-xs text-green-600 font-medium">✓ Complete</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="e.g. Driver name, truck plate, any damaged items…"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
            {loading ? "Saving…" : "Confirm Delivery & Update Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PO Detail Panel ──────────────────────────────────────────────────────────
function PODetail({ po, onAction, onClose }: { po: PO; onAction: (action: string) => void; onClose: () => void }) {
  const totalOrdered = po.items.reduce((s, i) => s + i.totalCost, 0);
  const totalReceived = po.receipts.flatMap((r) => r.items).reduce((s, i) => s + i.quantityReceived, 0);
  const totalShortfall = po.receipts.flatMap((r) => r.items).reduce((s, i) => s + i.quantityShortfall, 0);
  const meta = STATUS_META[po.status] || STATUS_META.DRAFT;

  // Pipeline steps
  const steps = ["Raised", "Approved", "Paid", "Delivered"];
  const currentStep = Math.min(meta.step, steps.length - 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-800 text-lg">{po.poNumber}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
          </div>
          <p className="text-sm text-slate-500">{po.brewery.name} · Raised by {po.raisedBy.name}</p>
          <p className="text-xs text-slate-400">{fmtDate(po.createdAt)}{po.expectedAt ? ` · Expected: ${fmtDate(po.expectedAt)}` : ""}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Pipeline */}
      {po.status !== "CANCELLED" && (
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < currentStep ? "bg-green-500 text-white" : i === currentStep ? "bg-[#1e3a5f] text-white" : "bg-slate-200 text-slate-400"}`}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${i <= currentStep ? "text-slate-700 font-medium" : "text-slate-400"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-green-400" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Products table */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Products Ordered</p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Product</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Ordered</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Unit Cost</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.items.map((item) => {
                const receivedQty = po.receipts.flatMap((r) => r.items).filter((ri) => ri.productId === item.productId).reduce((s, ri) => s + ri.quantityReceived, 0);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-800">{item.product.name}</p>
                      <p className="text-xs text-slate-400">{item.product.size} · SKU: {item.product.sku}</p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-bold text-slate-800">{item.quantityOrdered}</span>
                      {receivedQty > 0 && (
                        <p className="text-xs text-green-600">{receivedQty} in</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{fmt(item.unitCost)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt(item.totalCost)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold text-slate-700">Total Value</td>
                <td className="px-3 py-2 text-right font-bold text-[#1e3a5f]">{fmt(totalOrdered)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment info */}
      {po.payment && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
          <p className="font-semibold text-green-900 mb-2">Payment Recorded</p>
          <div className="grid grid-cols-2 gap-1 text-green-800">
            <span>Amount Paid:</span><span className="font-bold">{fmt(po.payment.amountPaid)}</span>
            <span>Date:</span><span>{fmtDate(po.payment.paidAt)}</span>
            {po.payment.bankName && <><span>Bank:</span><span>{po.payment.bankName}</span></>}
            {po.payment.transferRef && <><span>Ref:</span><span className="font-mono text-xs">{po.payment.transferRef}</span></>}
            <span>Recorded by:</span><span>{po.payment.paidBy.name}</span>
          </div>
        </div>
      )}

      {/* Delivery receipts */}
      {po.receipts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Delivery Receipts
            {totalShortfall > 0 && <span className="ml-2 text-orange-600">· {totalShortfall} crates short overall</span>}
          </p>
          <div className="space-y-2">
            {po.receipts.map((gr) => (
              <div key={gr.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-700">{gr.receiptNumber}</p>
                  <div className="flex items-center gap-2">
                    {gr.isPartial && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Partial</span>}
                    <span className="text-xs text-slate-400">{fmtDate(gr.receivedAt)} · {gr.receivedBy.name}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {gr.items.map((ri) => (
                    <div key={ri.productId} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{ri.product.name} ({ri.product.size})</span>
                      <div className="flex items-center gap-3">
                        <span className="text-green-700 font-medium">+{ri.quantityReceived} crates</span>
                        {ri.quantityShortfall > 0 && <span className="text-orange-600">({ri.quantityShortfall} short)</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {gr.notes && <p className="text-xs text-slate-400 mt-1 italic">{gr.notes}</p>}
              </div>
            ))}
          </div>
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex justify-between text-sm">
            <span className="text-blue-700">Total crates received</span>
            <span className="font-bold text-blue-900">{totalReceived} crates</span>
          </div>
        </div>
      )}

      {po.notes && (
        <div className="text-sm text-slate-500 italic border-t border-slate-100 pt-3">Notes: {po.notes}</div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {po.status === "PENDING_APPROVAL" && (
          <button onClick={() => onAction("approve")}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
            Approve PO
          </button>
        )}
        {po.status === "APPROVED" && (
          <button onClick={() => onAction("pay")}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">
            Record Payment
          </button>
        )}
        {["PAID", "PARTIALLY_RECEIVED"].includes(po.status) && (
          <button onClick={() => onAction("receive")}
            className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800">
            Record Delivery
          </button>
        )}
        {["PARTIALLY_RECEIVED", "RECEIVED"].includes(po.status) && (
          <button onClick={() => onAction("close")}
            className="px-4 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm hover:bg-slate-50">
            Close PO
          </button>
        )}
        {["PENDING_APPROVAL", "APPROVED"].includes(po.status) && (
          <button onClick={() => onAction("cancel")}
            className="px-4 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm hover:bg-red-50">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProcurementPage() {
  const [pos, setPOs] = useState<PO[]>([]);
  const [breweries, setBreweries] = useState<Brewery[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<PO | null>(null);
  const [showRaise, setShowRaise] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
    const [posRes, brewRes, prodRes] = await Promise.all([
      fetch(`/api/procurement${params}`).then((r) => r.json()),
      fetch("/api/breweries").then((r) => r.json()),
      fetch("/api/products?active=true").then((r) => r.json()),
    ]);
    setPOs(posRes);
    setBreweries(brewRes);
    setProducts(prodRes);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(action: string) {
    if (!selected) return;
    if (action === "pay") { setShowPay(true); return; }
    if (action === "receive") { setShowReceive(true); return; }

    const res = await fetch(`/api/procurement/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setActionMsg(`PO ${action === "approve" ? "approved" : action === "cancel" ? "cancelled" : "closed"} successfully`);
      await load();
      // Refresh selected
      const refreshed = await fetch(`/api/procurement/${selected.id}`).then((r) => r.json());
      setSelected(refreshed);
      setTimeout(() => setActionMsg(""), 4000);
    }
  }

  // Stats
  const pending = pos.filter((p) => p.status === "PENDING_APPROVAL").length;
  const awaitingDelivery = pos.filter((p) => ["PAID", "PARTIALLY_RECEIVED"].includes(p.status)).length;
  const totalSpend = pos.filter((p) => p.payment).reduce((s, p) => s + (p.payment?.amountPaid || 0), 0);

  const FILTERS = ["ALL", "PENDING_APPROVAL", "APPROVED", "PAID", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED", "CANCELLED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Procurement</h1>
          <p className="text-slate-500 text-sm mt-1">Raise orders, record payments, and confirm deliveries to warehouse</p>
        </div>
        <button onClick={() => setShowRaise(true)}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Raise PO
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending Approval", value: pending, color: "text-amber-600" },
          { label: "Awaiting Delivery", value: awaitingDelivery, color: "text-indigo-600" },
          { label: "Total POs", value: pos.length, color: "text-slate-800" },
          { label: "Total Spend (Paid)", value: fmt(totalSpend), color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {actionMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{actionMsg}</div>
      )}

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {f === "ALL" ? "All" : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* PO List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center"><div className="w-8 h-8 border-3 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : pos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium">No purchase orders yet</p>
              <p className="text-sm mt-1">Click "Raise PO" to create your first order</p>
            </div>
          ) : (
            pos.map((po) => {
              const meta = STATUS_META[po.status] || STATUS_META.DRAFT;
              const total = po.items.reduce((s, i) => s + i.totalCost, 0);
              const totalReceivedCrates = po.receipts.flatMap((r) => r.items).reduce((s, i) => s + i.quantityReceived, 0);
              const totalOrderedCrates = po.items.reduce((s, i) => s + i.quantityOrdered, 0);
              const isSelected = selected?.id === po.id;

              return (
                <button key={po.id} onClick={() => setSelected(isSelected ? null : po)}
                  className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all hover:shadow-md ${isSelected ? "border-[#1e3a5f] shadow-md" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-800">{po.poNumber}</p>
                      <p className="text-xs text-slate-500">{po.brewery.name} · {po.items.length} product{po.items.length !== 1 ? "s" : ""}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#1e3a5f]">{fmt(total)}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {totalOrderedCrates > 0 && <span>{totalReceivedCrates}/{totalOrderedCrates} crates in</span>}
                      <span>{fmtDate(po.createdAt)}</span>
                    </div>
                  </div>
                  {/* Mini progress bar for received */}
                  {["PAID", "PARTIALLY_RECEIVED", "RECEIVED"].includes(po.status) && totalOrderedCrates > 0 && (
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalReceivedCrates / totalOrderedCrates) * 100)}%` }} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <PODetail
            po={selected}
            onClose={() => setSelected(null)}
            onAction={handleAction}
          />
        )}
      </div>

      {/* Modals */}
      {showRaise && (
        <RaisePOModal
          breweries={breweries}
          products={products}
          onClose={() => setShowRaise(false)}
          onCreated={load}
        />
      )}
      {showPay && selected && (
        <PaymentModal
          po={selected}
          onClose={() => setShowPay(false)}
          onDone={async () => {
            await load();
            const refreshed = await fetch(`/api/procurement/${selected.id}`).then((r) => r.json());
            setSelected(refreshed);
          }}
        />
      )}
      {showReceive && selected && (
        <ReceiveModal
          po={selected}
          onClose={() => setShowReceive(false)}
          onDone={async () => {
            await load();
            const refreshed = await fetch(`/api/procurement/${selected.id}`).then((r) => r.json());
            setSelected(refreshed);
            setActionMsg("Delivery recorded — stock updated!");
            setTimeout(() => setActionMsg(""), 5000);
          }}
        />
      )}
    </div>
  );
}
