"use client";
import { useState } from "react";

const EXPORTS = [
  {
    type: "invoices",
    title: "Sales Invoices",
    desc: "Customer orders formatted for Peachtree Enterprise 2002 Sales Journal import",
    icon: "📄",
    hasDates: true,
  },
  {
    type: "customers",
    title: "Customer List",
    desc: "All customers formatted for Peachtree Customer Master import",
    icon: "👥",
    hasDates: false,
  },
  {
    type: "inventory",
    title: "Inventory Master",
    desc: "All products with current stock levels for Peachtree Inventory import",
    icon: "📦",
    hasDates: false,
  },
  {
    type: "stock_movement",
    title: "Stock Movements",
    desc: "Stock adjustments and movements for Peachtree Inventory Adjustment import",
    icon: "↕️",
    hasDates: true,
  },
  {
    type: "empties",
    title: "Empty Returns",
    desc: "Bottle empties log for reconciliation and credit tracking",
    icon: "🍺",
    hasDates: true,
  },
];

export default function ExportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  function download(type: string, hasDates: boolean) {
    const params = new URLSearchParams({ type });
    if (hasDates) { params.set("from", from); params.set("to", to); }
    window.location.href = `/api/export?${params}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Export to Peachtree Enterprise 2002</h1>
        <p className="text-slate-500 text-sm mt-1">Download CSV files formatted for direct import into your Peachtree accounting software.</p>
      </div>

      {/* How to import guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h2 className="font-semibold text-blue-900 mb-3">How to Import into Peachtree Enterprise 2002</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-800">
          <div className="flex gap-3">
            <span className="text-lg">1️⃣</span>
            <div>
              <p className="font-medium">Download the CSV</p>
              <p className="text-blue-600">Click the download button for the data type you need</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">2️⃣</span>
            <div>
              <p className="font-medium">Open Peachtree</p>
              <p className="text-blue-600">Go to <strong>File → Import/Export → Sales Journal</strong> (or relevant module)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">3️⃣</span>
            <div>
              <p className="font-medium">Import the file</p>
              <p className="text-blue-600">Select the downloaded CSV, map the fields, and click Import</p>
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-100 rounded-lg text-xs text-blue-700">
          <strong>Tip:</strong> For Peachtree Enterprise 2002, go to <code>File → Select Import/Export → Sales Invoices → Import</code>. Choose "Comma Separated" format and use the header row for field mapping. The Customer ID format is <code>CUST-[phone number]</code>.
        </div>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-700 mb-3">Date Range (for date-filtered exports)</h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            {[
              { label: "This Month", fn: () => { setFrom(monthStart); setTo(today); } },
              { label: "Last 7 Days", fn: () => { setFrom(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)); setTo(today); } },
              { label: "Today", fn: () => { setFrom(today); setTo(today); } },
            ].map((q) => (
              <button key={q.label} onClick={q.fn} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition-colors">{q.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORTS.map((exp) => (
          <div key={exp.type} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{exp.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-800">{exp.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{exp.desc}</p>
              </div>
            </div>
            {exp.hasDates && (
              <p className="text-xs text-slate-400 mb-3">Date range: {from} to {to}</p>
            )}
            <button
              onClick={() => download(exp.type, exp.hasDates)}
              className="mt-auto flex items-center justify-center gap-2 bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download CSV
            </button>
          </div>
        ))}
      </div>

      {/* Inventory improvement note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-900 mb-2">Making Inventory Easier</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-amber-800">
          <div>
            <p className="font-medium mb-1">Daily Workflow</p>
            <ol className="list-decimal pl-4 space-y-1 text-amber-700">
              <li>Every evening, go to <strong>Stock</strong> page and update crate counts</li>
              <li>System auto-deducts when you load trucks</li>
              <li>Returns from trucks are auto-added back</li>
              <li>Download <strong>Stock Movements</strong> CSV for Peachtree</li>
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">Monthly Workflow</p>
            <ol className="list-decimal pl-4 space-y-1 text-amber-700">
              <li>Download <strong>Sales Invoices</strong> CSV at month-end</li>
              <li>Import into Peachtree Sales Journal</li>
              <li>Download <strong>Inventory Master</strong> for stock count reconciliation</li>
              <li>Download <strong>Empties</strong> for deposit reconciliation with breweries</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
