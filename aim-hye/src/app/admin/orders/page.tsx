"use client";
import { useEffect, useState } from "react";
import { formatNaira, formatDate, STATUS_COLORS, ORDER_STATUSES } from "@/lib/utils";

interface OrderItem { product: { name: string; size: string; brewery: { shortName: string } }; quantity: number; unitPrice: number; subtotal: number }
interface Order {
  id: string; orderNo: string; status: string; totalAmount: number; depositAmount: number;
  deliveryAddress: string; notes: string; createdAt: string;
  customer: { name: string; phone: string; address: string };
  items: OrderItem[];
  assignedTruck: { plateNumber: string } | null;
}
interface Truck { id: string; plateNumber: string; make: string; model: string }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then(setOrders);
    fetch("/api/trucks").then((r) => r.json()).then(setTrucks);
  }, []);

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  async function updateStatus(id: string, status: string, assignedTruckId?: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(assignedTruckId ? { assignedTruckId } : {}) }),
    });
    const updated = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    if (selected?.id === id) setSelected(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-slate-500 text-sm">{filtered.length} orders shown</p>
        </div>
        <div className="flex gap-2">
          {["all", ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === s ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order list */}
        <div className="lg:col-span-1 space-y-3">
          {filtered.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelected(order)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:border-blue-300 transition-colors ${selected?.id === order.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800 text-sm">{order.orderNo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{order.status}</span>
              </div>
              <p className="text-sm text-slate-600">{order.customer.name}</p>
              <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{formatNaira(order.totalAmount)}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">No orders found</div>
          )}
        </div>

        {/* Order detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{selected.orderNo}</h2>
                  <p className="text-sm text-slate-500">{formatDate(selected.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>

              {/* Customer */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                <h3 className="text-sm font-semibold text-slate-700">Customer</h3>
                <p className="text-slate-800 font-medium">{selected.customer.name}</p>
                <p className="text-sm text-slate-500">{selected.customer.phone}</p>
                <p className="text-sm text-slate-500">{selected.deliveryAddress}</p>
                {selected.notes && <p className="text-sm text-slate-500 italic">{selected.notes}</p>}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.product.name} ({item.product.size})</p>
                        <p className="text-xs text-slate-400">{item.product.brewery.shortName} · {item.quantity} crates × {formatNaira(item.unitPrice)}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{formatNaira(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">{formatNaira(selected.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Bottle Deposit</span>
                    <span className="font-medium">{formatNaira(selected.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
                    <span>Total Payable</span>
                    <span>{formatNaira(selected.totalAmount + selected.depositAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {selected.status === "PENDING" && (
                  <button onClick={() => updateStatus(selected.id, "CONFIRMED")} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Confirm Order</button>
                )}
                {selected.status === "CONFIRMED" && (
                  <div className="flex gap-2 flex-1">
                    <select
                      onChange={(e) => e.target.value && updateStatus(selected.id, "DISPATCHED", e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1"
                    >
                      <option value="">Assign truck & dispatch...</option>
                      {trucks.map((t) => <option key={t.id} value={t.id}>{t.plateNumber} ({t.make} {t.model})</option>)}
                    </select>
                  </div>
                )}
                {selected.status === "DISPATCHED" && (
                  <button onClick={() => updateStatus(selected.id, "DELIVERED")} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Mark Delivered</button>
                )}
                {!["DELIVERED", "CANCELLED"].includes(selected.status) && (
                  <button onClick={() => updateStatus(selected.id, "CANCELLED")} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">Cancel</button>
                )}
                {selected.assignedTruck && (
                  <p className="text-sm text-slate-500 self-center">Truck: {selected.assignedTruck.plateNumber}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">🛒</p>
              <p>Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
