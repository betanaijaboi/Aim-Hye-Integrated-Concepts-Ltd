"use client";
import { useEffect, useState } from "react";
import { formatNaira, formatDate, STATUS_COLORS } from "@/lib/utils";

interface Allocation {
  id: string; productId: string; cratesLoaded: number; cratesReturn: number; cratesSold: number;
  pricePerCrate: number; totalValue: number; amountRemitted: number; status: string; date: string; notes: string;
  product: { name: string; size: string; brewery: { shortName: string } };
}
interface Truck {
  id: string; plateNumber: string; make: string; model: string; year: number; color: string;
  capacity: number; isActive: boolean; notes: string;
  driver: { id: string; firstName: string; lastName: string; phone: string } | null;
  salesboy: { id: string; firstName: string; lastName: string; phone: string } | null;
  allocations: Allocation[];
}
interface Product { id: string; name: string; size: string; pricePerCrate: number; stockCrates: number; brewery: { shortName: string } }

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Truck | null>(null);
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadItems, setLoadItems] = useState<Array<{ productId: string; cratesLoaded: number }>>([{ productId: "", cratesLoaded: 0 }]);
  const [saving, setSaving] = useState(false);

  // New truck form
  const [form, setForm] = useState({ plateNumber: "", make: "", model: "", year: new Date().getFullYear(), color: "", capacity: 200, notes: "" });

  useEffect(() => {
    fetch("/api/trucks").then((r) => r.json()).then((data) => { setTrucks(data); if (data.length) setSelected(data[0]); });
    fetch("/api/products?active=true").then((r) => r.json()).then(setProducts);
  }, []);

  async function addTruck() {
    setSaving(true);
    const res = await fetch("/api/trucks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const truck = await res.json();
    setTrucks((prev) => [...prev, truck]);
    setShowAddTruck(false);
    setSaving(false);
  }

  async function loadTruck() {
    if (!selected) return;
    setSaving(true);
    const items = loadItems.filter((i) => i.productId && i.cratesLoaded > 0).map((i) => {
      const p = products.find((p) => p.id === i.productId)!;
      return { truckId: selected.id, productId: i.productId, cratesLoaded: i.cratesLoaded, pricePerCrate: p.pricePerCrate };
    });
    await fetch("/api/allocations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items) });
    // Refresh
    const fresh = await fetch("/api/trucks").then((r) => r.json());
    setTrucks(fresh);
    setSelected(fresh.find((t: Truck) => t.id === selected.id) || null);
    setShowLoadModal(false);
    setLoadItems([{ productId: "", cratesLoaded: 0 }]);
    setSaving(false);
  }

  async function reconcile(alloc: Allocation, cratesReturn: number) {
    await fetch(`/api/allocations/${alloc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cratesReturn, cratesLoaded: alloc.cratesLoaded, status: "RETURNED" }),
    });
    const fresh = await fetch("/api/trucks").then((r) => r.json());
    setTrucks(fresh);
    setSelected(fresh.find((t: Truck) => t.id === selected?.id) || null);
  }

  const todayAllocs = selected?.allocations.filter((a) => {
    const d = new Date(a.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trucks & Crew</h1>
          <p className="text-slate-500 text-sm">Manage your fleet, load trucks, and reconcile daily sales.</p>
        </div>
        <button onClick={() => setShowAddTruck(true)} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">+ Add Truck</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Truck list */}
        <div className="space-y-3">
          {trucks.map((truck) => (
            <button
              key={truck.id}
              onClick={() => setSelected(truck)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:border-blue-300 transition-colors ${selected?.id === truck.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">{truck.plateNumber}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${truck.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{truck.isActive ? "Active" : "Inactive"}</span>
              </div>
              <p className="text-sm text-slate-500">{truck.year} {truck.make} {truck.model} · {truck.color}</p>
              <div className="mt-2 flex gap-2 text-xs text-slate-400">
                <span>🚗 {truck.driver ? `${truck.driver.firstName} ${truck.driver.lastName}` : "No driver"}</span>
              </div>
              <div className="text-xs text-slate-400">
                <span>👤 {truck.salesboy ? `${truck.salesboy.firstName} ${truck.salesboy.lastName}` : "No salesboy"}</span>
              </div>
            </button>
          ))}
          {trucks.length === 0 && <p className="text-slate-400 text-center py-8">No trucks added yet</p>}
        </div>

        {/* Truck detail */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              {/* Truck info card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selected.plateNumber}</h2>
                    <p className="text-slate-500">{selected.year} {selected.make} {selected.model} · {selected.color} · Cap: {selected.capacity} crates</p>
                  </div>
                  <button onClick={() => setShowLoadModal(true)} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">Load Truck</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Driver</p>
                    {selected.driver ? (
                      <div>
                        <p className="font-medium text-slate-800">{selected.driver.firstName} {selected.driver.lastName}</p>
                        <p className="text-sm text-slate-500">{selected.driver.phone}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Not assigned</p>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Salesboy</p>
                    {selected.salesboy ? (
                      <div>
                        <p className="font-medium text-slate-800">{selected.salesboy.firstName} {selected.salesboy.lastName}</p>
                        <p className="text-sm text-slate-500">{selected.salesboy.phone}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Not assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Today's allocation */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Today's Allocation</h3>
                {todayAllocs.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No stock loaded today</p>
                ) : (
                  <div className="space-y-3">
                    {todayAllocs.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{a.product.name} ({a.product.size})</p>
                          <p className="text-xs text-slate-400">{a.product.brewery.shortName} · Loaded: {a.cratesLoaded} crates</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{formatNaira(a.totalValue)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                          </div>
                          {a.status === "LOADED" && (
                            <button
                              onClick={() => {
                                const ret = parseInt(prompt(`Crates returned for ${a.product.name}?`) || "0");
                                reconcile(a, ret);
                              }}
                              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                            >
                              Return
                            </button>
                          )}
                          {a.status === "RETURNED" && (
                            <p className="text-xs text-slate-400">Sold: {a.cratesSold} · Returned: {a.cratesReturn}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between font-semibold text-slate-800">
                      <span>Total Value Loaded</span>
                      <span>{formatNaira(todayAllocs.reduce((s, a) => s + a.totalValue, 0))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Allocation History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selected.allocations.slice(0, 20).map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                      <div>
                        <span className="text-slate-700">{a.product.name} ({a.product.size})</span>
                        <span className="text-slate-400 ml-2">· {formatDate(a.date)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">{a.cratesLoaded} crates</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">🚛</p>
              <p>Select a truck to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Truck Modal */}
      {showAddTruck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Add New Truck</h2>
            <div className="space-y-3">
              {[
                { label: "Plate Number", key: "plateNumber", placeholder: "e.g. LKJ-123-AB" },
                { label: "Make", key: "make", placeholder: "e.g. Toyota" },
                { label: "Model", key: "model", placeholder: "e.g. Hilux" },
                { label: "Color", key: "color", placeholder: "e.g. White" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (crates)</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddTruck(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={addTruck} disabled={saving} className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60">{saving ? "Saving..." : "Add Truck"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Truck Modal */}
      {showLoadModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Load Truck — {selected.plateNumber}</h2>
            <p className="text-sm text-slate-500 mb-4">Select products and quantities to load onto this truck.</p>
            <div className="space-y-3">
              {loadItems.map((item, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => { const n = [...loadItems]; n[i].productId = e.target.value; setLoadItems(n); }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.brewery.shortName} · {p.name} ({p.size}) — {p.stockCrates} crates avail.</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Crates</label>
                    <input
                      type="number" min={0}
                      value={item.cratesLoaded}
                      onChange={(e) => { const n = [...loadItems]; n[i].cratesLoaded = Number(e.target.value); setLoadItems(n); }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  {loadItems.length > 1 && (
                    <button onClick={() => setLoadItems(loadItems.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 pb-2">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setLoadItems([...loadItems, { productId: "", cratesLoaded: 0 }])} className="text-sm text-blue-600 hover:underline">+ Add another product</button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowLoadModal(false); setLoadItems([{ productId: "", cratesLoaded: 0 }]); }} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={loadTruck} disabled={saving} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm hover:bg-amber-600 disabled:opacity-60">{saving ? "Loading..." : "Load Truck"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
