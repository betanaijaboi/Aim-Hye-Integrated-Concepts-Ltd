"use client";
import { useEffect, useState } from "react";
import { formatNaira, formatDate } from "@/lib/utils";

interface EmptyReturn {
  id: string; cratesReturned: number; looseBottles: number; totalBottles: number;
  depositValue: number; date: string; notes: string;
  truck: { plateNumber: string };
  product: { name: string; size: string; packSize: number; brewery: { name: string; shortName: string } };
}
interface Truck { id: string; plateNumber: string }
interface Product { id: string; name: string; size: string; packSize: number; depositPerCrate: number; brewery: { shortName: string } }

export default function EmptiesPage() {
  const [records, setRecords] = useState<EmptyReturn[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ truckId: "", productId: "", cratesReturned: 0, looseBottles: 0, notes: "" });
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch(`/api/empties?date=${dateFilter}`).then((r) => r.json()).then(setRecords);
    fetch("/api/trucks").then((r) => r.json()).then(setTrucks);
    fetch("/api/products?active=true").then((r) => r.json()).then(setProducts);
  }, [dateFilter]);

  const selectedProduct = products.find((p) => p.id === form.productId);
  const estDeposit = (form.cratesReturned * (selectedProduct?.depositPerCrate || 0));
  const totalBottles = form.cratesReturned * (selectedProduct?.packSize || 12) + form.looseBottles;

  async function submit() {
    setSaving(true);
    await fetch("/api/empties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ truckId: "", productId: "", cratesReturned: 0, looseBottles: 0, notes: "" });
    fetch(`/api/empties?date=${dateFilter}`).then((r) => r.json()).then(setRecords);
    setSaving(false);
  }

  const totalDeposit = records.reduce((s, r) => s + r.depositValue, 0);
  const totalCrates = records.reduce((s, r) => s + r.cratesReturned, 0);

  // Group by truck
  const byTruck: Record<string, { truck: { plateNumber: string }; items: EmptyReturn[] }> = {};
  for (const r of records) {
    const key = r.truck.plateNumber;
    if (!byTruck[key]) byTruck[key] = { truck: r.truck, items: [] };
    byTruck[key].items.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Empties Management</h1>
          <p className="text-slate-500 text-sm">Track empty bottles returned by each truck. These generate deposit refund credits.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">+ Record Empties</button>
      </div>

      {/* Date selector & summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-2">Filter by Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-orange-400 p-4">
          <p className="text-xs text-slate-500">Total Crates Returned</p>
          <p className="text-3xl font-bold text-slate-800">{totalCrates}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-green-500 p-4">
          <p className="text-xs text-slate-500">Total Deposit Value</p>
          <p className="text-3xl font-bold text-slate-800">{formatNaira(totalDeposit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-l-4 border-blue-500 p-4">
          <p className="text-xs text-slate-500">Trucks Accounted For</p>
          <p className="text-3xl font-bold text-slate-800">{Object.keys(byTruck).length}</p>
        </div>
      </div>

      {/* Explainer card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">How the Empties System Works</p>
        <p>When your trucks receive empty bottles from customers, they return them to the warehouse. You record those here. The brewery then gives you a deposit credit per crate based on the bottle size. Glass 33cl bottles and 60cl bottles carry different deposit values per crate.</p>
      </div>

      {/* Records by truck */}
      {Object.keys(byTruck).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">🍺</p>
          <p>No empty bottle returns recorded for {formatDate(dateFilter)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byTruck).map(([plate, { items }]) => {
            const truckDeposit = items.reduce((s, i) => s + i.depositValue, 0);
            const truckCrates = items.reduce((s, i) => s + i.cratesReturned, 0);
            return (
              <div key={plate} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🚛</span>
                    <div>
                      <p className="font-semibold text-slate-800">Truck: {plate}</p>
                      <p className="text-xs text-slate-400">{items.length} item(s) returned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatNaira(truckDeposit)}</p>
                    <p className="text-xs text-slate-400">{truckCrates} crates</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-3 font-medium text-slate-500">Product</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Crates</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Loose Bottles</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Total Bottles</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Deposit Value</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-6 py-3">
                            <p className="font-medium text-slate-800">{r.product.name} ({r.product.size})</p>
                            <p className="text-xs text-slate-400">{r.product.brewery.shortName} · {r.product.packSize} btl/crate</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{r.cratesReturned}</td>
                          <td className="px-4 py-3 text-right">{r.looseBottles}</td>
                          <td className="px-4 py-3 text-right">{r.totalBottles}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">{formatNaira(r.depositValue)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{r.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Record Empty Returns</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Truck</label>
                <select value={form.truckId} onChange={(e) => setForm({ ...form, truckId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select truck...</option>
                  {trucks.map((t) => <option key={t.id} value={t.id}>{t.plateNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product / Bottle Type</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.brewery.shortName} · {p.name} ({p.size}) — ₦{p.depositPerCrate}/crate deposit</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Crates Returned</label>
                  <input type="number" min={0} value={form.cratesReturned} onChange={(e) => setForm({ ...form, cratesReturned: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loose Bottles</label>
                  <input type="number" min={0} value={form.looseBottles} onChange={(e) => setForm({ ...form, looseBottles: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {form.productId && (
                <div className="bg-green-50 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated total bottles:</span>
                    <span className="font-bold">{totalBottles}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-semibold mt-1">
                    <span>Estimated deposit credit:</span>
                    <span>{formatNaira(estDeposit)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={saving || !form.truckId || !form.productId} className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60">{saving ? "Saving..." : "Record Empties"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
