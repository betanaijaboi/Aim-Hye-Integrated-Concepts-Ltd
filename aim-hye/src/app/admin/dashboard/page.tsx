"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNaira, formatDate, STATUS_COLORS } from "@/lib/utils";

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  activeTrucks: number;
  todayAllocValue: number;
  todayEmptiesValue: number;
  lowStockProducts: Array<{ id: string; name: string; size: string; stockCrates: number; minStockCrates: number; brewery: { shortName: string } }>;
  recentOrders: Array<{ id: string; orderNo: string; status: string; totalAmount: number; createdAt: string; customer: { name: string } }>;
}

function StatCard({ title, value, sub, color }: { title: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl p-6 border border-slate-200 border-l-4 ${color}`}>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm">Welcome back — here is your business overview for today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={formatNaira(data.todayRevenue)} sub="From orders placed today" color="border-green-500" />
        <StatCard title="Pending Orders" value={String(data.pendingOrders)} sub={`${data.totalOrders} total orders`} color="border-amber-500" />
        <StatCard title="Active Trucks" value={String(data.activeTrucks)} sub="On the road today" color="border-blue-500" />
        <StatCard title="Total Customers" value={String(data.totalCustomers)} sub="All registered buyers" color="border-purple-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Truck Allocation Value" value={formatNaira(data.todayAllocValue)} sub="Total value loaded today" color="border-slate-400" />
        <StatCard title="Empties Deposit Value" value={formatNaira(data.todayEmptiesValue)} sub="Bottles returned today" color="border-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{order.orderNo}</p>
                  <p className="text-xs text-slate-400">{order.customer.name} · {formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatNaira(order.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No orders yet</p>}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Low Stock Alert</h2>
            <Link href="/admin/stock" className="text-xs text-blue-600 hover:underline">Update stock</Link>
          </div>
          <div className="space-y-3">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-green-600 text-center py-4">All stock levels are healthy</p>
            ) : (
              data.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name} ({p.size})</p>
                    <p className="text-xs text-slate-400">{p.brewery.shortName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${p.stockCrates <= 0 ? "text-red-600" : "text-amber-600"}`}>{p.stockCrates} crates</p>
                    <p className="text-xs text-slate-400">min: {p.minStockCrates}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/orders", label: "New Order", icon: "🛒", color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
            { href: "/admin/stock", label: "Update Stock", icon: "📦", color: "bg-green-50 hover:bg-green-100 text-green-700" },
            { href: "/admin/trucks", label: "Load Truck", icon: "🚛", color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
            { href: "/admin/empties", label: "Record Empties", icon: "🍺", color: "bg-amber-50 hover:bg-amber-100 text-amber-700" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`${a.color} rounded-xl p-4 text-center transition-colors`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <p className="text-sm font-medium">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
