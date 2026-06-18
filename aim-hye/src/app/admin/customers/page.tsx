"use client";
import { useEffect, useState } from "react";
import { formatNaira, formatDate } from "@/lib/utils";

interface Customer { id: string; name: string; phone: string; email: string; address: string; lga: string; state: string; isActive: boolean; createdAt: string; _count: { orders: number } }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", lga: "", state: "Oyo" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, []);

  const filtered = customers.filter((c) =>
    `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  async function addCustomer() {
    setSaving(true);
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const c = await res.json();
    setCustomers((prev) => [{ ...c, _count: { orders: 0 } }, ...prev]);
    setShowModal(false);
    setForm({ name: "", phone: "", email: "", address: "", lga: "", state: "Oyo" });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm">{customers.length} registered customers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">+ Add Customer</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Address</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Orders</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Since</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{c.name}</p>
                  {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{c.address}{c.lga ? `, ${c.lga}` : ""}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{c._count.orders}</td>
                <td className="px-4 py-3 text-slate-400">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.isActive ? "Active" : "Inactive"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-400 py-10">No customers found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Add Customer</h2>
            <div className="space-y-3">
              {[
                { label: "Full Name *", key: "name" }, { label: "Phone *", key: "phone" },
                { label: "Email", key: "email" }, { label: "Address", key: "address" },
                { label: "LGA", key: "lga" }, { label: "State", key: "state" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={addCustomer} disabled={saving} className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg text-sm disabled:opacity-60">{saving ? "Saving..." : "Add Customer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
