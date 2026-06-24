"use client";
import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";
import { useAdminBranch } from "../layout";

interface Product {
  id: string;
  name: string;
  sku: string;
  size: string;
  category: string;
  stockCrates: number;
  minStockCrates: number;
  pricePerCrate: number;
  depositPerCrate: number;
  packSize: number;
  isActive: boolean;
  brewery: { id: string; name: string; shortName: string };
}

export default function StockPage() {
  const { branch } = useAdminBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState("");
  const [brewFilter, setBrewFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/products?active=true&branch=${branch}`).then((r) => r.json()).then(setProducts);
    setEdits({});
  }, [branch]);

  const breweries = [...new Set(products.map((p) => p.brewery.name))];
  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchText = `${p.name} ${p.sku} ${p.brewery.name}`.toLowerCase().includes(filter.toLowerCase());
    const matchBrew = brewFilter === "all" || p.brewery.name === brewFilter;
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchText && matchBrew && matchCat;
  });

  async function saveAll() {
    if (Object.keys(edits).length === 0) return;
    setSaving(true);
    const updates = Object.entries(edits).map(([productId, stockCrates]) => ({
      productId,
      stockCrates,
      notes: "Evening stock update",
    }));
    await fetch("/api/stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    // refresh
    const fresh = await fetch("/api/products?active=true").then((r) => r.json());
    setProducts(fresh);
    setEdits({});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function updateSingle(id: string, val: number) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockCrates: val, reason: "EVENING_UPDATE" }),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stockCrates: val } : p)));
    const newEdits = { ...edits };
    delete newEdits[id];
    setEdits(newEdits);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stock Management</h1>
          <p className="text-slate-500 text-sm">Update your warehouse stock levels. Changes are logged with timestamps.</p>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(edits).length > 0 && (
            <span className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">{Object.keys(edits).length} unsaved changes</span>
          )}
          {saved && <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">Saved!</span>}
          <button
            onClick={saveAll}
            disabled={saving || Object.keys(edits).length === 0}
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <input
          type="text"
          placeholder="Search products..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={brewFilter}
          onChange={(e) => setBrewFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Breweries</option>
          {breweries.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Brewery</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Size</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Price/Crate</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Deposit/Crate</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 w-36">Stock (Crates)</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const currentVal = edits[p.id] ?? p.stockCrates;
                const isLow = currentVal <= p.minStockCrates;
                const hasEdit = p.id in edits;
                return (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 ${hasEdit ? "bg-amber-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.sku} · {p.packSize} bottles/crate</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{p.brewery.shortName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.size}</td>
                    <td className="px-4 py-3 text-right text-slate-800 font-medium">{formatNaira(p.pricePerCrate)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatNaira(p.depositPerCrate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={0}
                          value={currentVal}
                          onChange={(e) => setEdits({ ...edits, [p.id]: Number(e.target.value) })}
                          className={`w-24 border rounded-lg px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLow ? "border-red-300 bg-red-50" : "border-slate-300"
                          } ${hasEdit ? "border-amber-400" : ""}`}
                        />
                        {hasEdit && (
                          <button
                            onClick={() => updateSingle(p.id, currentVal)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {currentVal <= 0 ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                      ) : isLow ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Low Stock</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-12">No products found</p>
        )}
      </div>
    </div>
  );
}
