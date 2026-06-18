"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type PersonType = "driver" | "salesboy";

interface Guarantor { id: string; name: string; phone: string; address: string; occupation: string; relationship: string }
interface Person {
  id: string; firstName: string; lastName: string; phone: string; alternatePhone: string;
  address: string; lga: string; state: string; nin: string; photoUrl: string; ninDocUrl: string;
  isActive: boolean; startDate: string; notes: string; truck: { plateNumber: string } | null;
  guarantors: Guarantor[];
  licenseNo?: string; licenseExpiry?: string; licenseDocUrl?: string; // driver only
}
interface Truck { id: string; plateNumber: string }

const emptyForm = {
  firstName: "", lastName: "", phone: "", alternatePhone: "", address: "", lga: "", state: "Oyo",
  nin: "", licenseNo: "", notes: "", truckId: "",
  guarantors: [{ name: "", phone: "", address: "", occupation: "", relationship: "" }],
};

export default function DriversPage() {
  const [type, setType] = useState<PersonType>("driver");
  const [people, setPeople] = useState<Person[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    fetch("/api/trucks").then((r) => r.json()).then(setTrucks);
  }, [type]);

  function loadData() {
    fetch(`/api/${type}s`).then((r) => r.json()).then((data) => {
      setPeople(data);
      setSelected(data[0] || null);
    });
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, guarantors: form.guarantors.filter((g) => g.name) };
    await fetch(`/api/${type}s`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setShowModal(false);
    setForm(emptyForm);
    loadData();
    setSaving(false);
  }

  function updateGuarantor(i: number, key: string, val: string) {
    const g = [...form.guarantors];
    g[i] = { ...g[i], [key]: val };
    setForm({ ...form, guarantors: g });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Drivers & Salesboys</h1>
          <p className="text-slate-500 text-sm">Manage crew profiles, guarantors, and documentation.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setType("driver")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === "driver" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>Drivers</button>
            <button onClick={() => setType("salesboy")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === "salesboy" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>Salesboys</button>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">+ Add {type === "driver" ? "Driver" : "Salesboy"}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-3">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:border-blue-300 transition-colors ${selected?.id === p.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-slate-400">{p.phone}</p>
                  {p.truck && <p className="text-xs text-blue-600">Truck: {p.truck.plateNumber}</p>}
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                <span className="text-xs text-slate-400 ml-2">{p.guarantors?.length || 0} guarantor(s)</span>
              </div>
            </button>
          ))}
          {people.length === 0 && <p className="text-slate-400 text-center py-8">No {type}s added yet</p>}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-2xl font-bold text-slate-600">
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-800">{selected.firstName} {selected.lastName}</h2>
                  <p className="text-slate-500 capitalize">{type}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selected.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{selected.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>

              {/* Bio */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Phone", value: selected.phone },
                  { label: "Alternate Phone", value: selected.alternatePhone },
                  { label: "Address", value: selected.address },
                  { label: "LGA / State", value: `${selected.lga || "—"} / ${selected.state || "—"}` },
                  { label: "NIN", value: selected.nin || "Not provided" },
                  { label: "Start Date", value: selected.startDate ? formatDate(selected.startDate) : "—" },
                  ...(type === "driver" ? [
                    { label: "License No.", value: selected.licenseNo || "—" },
                    { label: "License Expiry", value: selected.licenseExpiry ? formatDate(selected.licenseExpiry) : "—" },
                  ] : []),
                  { label: "Assigned Truck", value: selected.truck?.plateNumber || "Not assigned" },
                ].map((f) => (
                  <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 font-medium">{f.label}</p>
                    <p className="text-slate-700 font-medium mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Documents</h3>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: "NIN Document", url: selected.ninDocUrl },
                    ...(type === "driver" ? [{ label: "Driver's License", url: (selected as Person & { licenseDocUrl?: string }).licenseDocUrl }] : []),
                    { label: "Photo", url: selected.photoUrl },
                  ].map((doc) => (
                    <div key={doc.label} className={`px-3 py-2 rounded-lg text-sm ${doc.url ? "bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200" : "bg-slate-100 text-slate-400"}`}>
                      {doc.url ? <a href={doc.url} target="_blank" rel="noreferrer">{doc.label} ↗</a> : doc.label + " (not uploaded)"}
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantors */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Guarantors ({selected.guarantors?.length || 0})</h3>
                {selected.guarantors?.length ? (
                  <div className="space-y-3">
                    {selected.guarantors.map((g, i) => (
                      <div key={g.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-slate-800">{g.name}</p>
                          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">#{i + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                          <span>📞 {g.phone}</span>
                          <span>💼 {g.occupation || "—"}</span>
                          <span>🔗 {g.relationship || "—"}</span>
                          <span>📍 {g.address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No guarantors recorded</p>
                )}
              </div>

              {selected.notes && (
                <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">Notes</p>
                  <p>{selected.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">👤</p>
              <p>Select a {type} to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Add {type === "driver" ? "Driver" : "Salesboy"}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "First Name *", key: "firstName" }, { label: "Last Name *", key: "lastName" },
                { label: "Phone *", key: "phone" }, { label: "Alternate Phone", key: "alternatePhone" },
                { label: "Address *", key: "address" }, { label: "LGA", key: "lga" },
                { label: "State", key: "state" }, { label: "NIN", key: "nin" },
                ...(type === "driver" ? [{ label: "License No.", key: "licenseNo" }] : []),
              ].map((f) => (
                <div key={f.key} className={f.key === "address" ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Assign to Truck</label>
                <select value={form.truckId} onChange={(e) => setForm({ ...form, truckId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {trucks.map((t) => <option key={t.id} value={t.id}>{t.plateNumber}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
            </div>

            {/* Guarantors */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Guarantors</h3>
                <button onClick={() => setForm({ ...form, guarantors: [...form.guarantors, { name: "", phone: "", address: "", occupation: "", relationship: "" }] })} className="text-xs text-blue-600 hover:underline">+ Add Guarantor</button>
              </div>
              {form.guarantors.map((g, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 mb-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Guarantor #{i + 1}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Full Name *", key: "name" }, { label: "Phone *", key: "phone" },
                      { label: "Address", key: "address" }, { label: "Occupation", key: "occupation" },
                      { label: "Relationship", key: "relationship" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                        <input value={g[f.key as keyof typeof g]} onChange={(e) => updateGuarantor(i, f.key, e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setForm(emptyForm); }} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60">{saving ? "Saving..." : `Add ${type === "driver" ? "Driver" : "Salesboy"}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
