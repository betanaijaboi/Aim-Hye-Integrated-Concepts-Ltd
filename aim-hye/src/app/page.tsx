"use client";
import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

interface Product {
  id: string; name: string; size: string; category: string; pricePerCrate: number;
  pricePerBottle: number; depositPerCrate: number; stockCrates: number; packSize: number;
  brewery: { name: string; shortName: string };
}
interface CartItem { product: Product; quantity: number }

const BREWERIES = ["All", "Champion Breweries", "International Breweries", "Nigerian Breweries", "Guinness Nigeria"];
const CATS = ["All", "lager", "stout", "malt", "rtd", "spirits"];

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [brewery, setBrewery] = useState("All");
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [order, setOrder] = useState({ name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderNo: string; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/products?active=true").then((r) => r.json()).then((data: Product[]) =>
      setProducts(data.filter((p) => p.stockCrates > 0))
    );
  }, []);

  const filtered = products.filter((p) => {
    const matchBrew = brewery === "All" || p.brewery.name === brewery;
    const matchCat = cat === "All" || p.category === cat;
    const matchSearch = `${p.name} ${p.brewery.name}`.toLowerCase().includes(search.toLowerCase());
    return matchBrew && matchCat && matchSearch;
  });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.product.id !== id));
    else setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i));
  }

  const subtotal = cart.reduce((s, i) => s + i.product.pricePerCrate * i.quantity, 0);
  const deposit = cart.reduce((s, i) => s + i.product.depositPerCrate * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  async function placeOrder() {
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { name: order.name, phone: order.phone, address: order.address },
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        deliveryAddress: order.address,
        notes: order.notes,
      }),
    });
    const data = await res.json();
    setOrderPlaced({ orderNo: data.orderNo, total: data.totalAmount + data.depositAmount });
    setCart([]);
    setShowCheckout(false);
    setSubmitting(false);
  }

  const catLabels: Record<string, string> = { lager: "Lager", stout: "Stout", malt: "Malt", rtd: "RTD", spirits: "Spirits" };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-bold text-xl">A</div>
            <div>
              <p className="font-bold text-lg leading-tight">Aim-Hye Integrated Concepts</p>
              <p className="text-blue-300 text-xs">Certified Drinks Distributor — Nigeria</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-amber-500 hover:bg-amber-600 transition-colors text-white px-4 py-2 rounded-xl font-medium"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Order Your Favourite Drinks</h1>
          <p className="text-blue-200 text-lg">Champion · International · Nigerian · Guinness Breweries — All in one place</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["🍺 Lager Beers", "🖤 Stouts", "🥤 Malt Drinks", "🍹 RTD", "🥃 Spirits"].map((b) => (
              <span key={b} className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search drinks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-2">
            {BREWERIES.map((b) => (
              <button
                key={b}
                onClick={() => setBrewery(b)}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors ${brewery === b ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
              >
                {b === "All" ? "All Breweries" : b.replace(" Breweries", "").replace(" Nigeria", "")}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`text-xs px-3 py-2 rounded-xl border transition-colors capitalize ${cat === c ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
              >
                {c === "All" ? "All Types" : catLabels[c] || c}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
          {filtered.map((p) => {
            const inCart = cart.find((i) => i.product.id === p.id);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-32 flex items-center justify-center text-5xl">
                  {p.category === "stout" ? "🖤" : p.category === "malt" ? "🥤" : p.category === "spirits" ? "🥃" : p.category === "rtd" ? "🍹" : "🍺"}
                </div>
                <div className="p-3">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.brewery.shortName}</span>
                  <h3 className="font-semibold text-slate-800 text-sm mt-1 leading-tight">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.size} · {p.packSize} bottles/crate</p>
                  <p className="text-base font-bold text-[#1e3a5f] mt-1">{formatNaira(p.pricePerCrate)}<span className="text-xs font-normal text-slate-400">/crate</span></p>
                  <p className="text-xs text-slate-400">+{formatNaira(p.depositPerCrate)} deposit/crate</p>
                  <p className="text-xs text-slate-400">{p.stockCrates} crates available</p>

                  {inCart ? (
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(p.id, inCart.quantity - 1)} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100">-</button>
                      <span className="font-bold text-slate-800 text-sm">{inCart.quantity}</span>
                      <button onClick={() => updateQty(p.id, inCart.quantity + 1)} className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center hover:bg-blue-800">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="w-full mt-2 bg-[#1e3a5f] text-white text-xs py-2 rounded-xl hover:bg-blue-800 transition-colors font-medium"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">🍺</p>
            <p className="text-lg">No products found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white mt-16 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-bold text-lg">Aim-Hye Integrated Concepts Limited</p>
          <p className="text-blue-300 text-sm mt-1">Authorized distributor of Champion, International, Nigerian & Guinness Breweries</p>
          <p className="text-blue-400 text-xs mt-3">Orders are processed within 24 hours · Delivery available in your area</p>
        </div>
      </footer>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Your Cart ({cartCount} crates)</h2>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <p className="text-4xl mb-3">🛒</p>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 bg-slate-50 rounded-xl p-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{item.product.name} ({item.product.size})</p>
                      <p className="text-xs text-slate-400">{item.product.brewery.shortName} · {formatNaira(item.product.pricePerCrate)}/crate</p>
                      <p className="text-sm font-bold text-[#1e3a5f]">{formatNaira(item.product.pricePerCrate * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-200">-</button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{formatNaira(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bottle Deposit</span><span className="font-medium">{formatNaira(deposit)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Total</span><span>{formatNaira(subtotal + deposit)}</span></div>
                </div>
                <p className="text-xs text-slate-400">Deposit is refundable when you return empty bottles.</p>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors">Checkout →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Complete Your Order</h2>
            <div className="space-y-3 mb-5">
              {[
                { label: "Full Name *", key: "name", type: "text" },
                { label: "Phone Number *", key: "phone", type: "tel" },
                { label: "Delivery Address *", key: "address", type: "text" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={order[f.key as keyof typeof order]}
                    onChange={(e) => setOrder({ ...order, [f.key]: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                <textarea value={order.notes} onChange={(e) => setOrder({ ...order, notes: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none" rows={2} />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <p className="font-semibold text-slate-700 mb-2">Order Summary</p>
              {cart.map((i) => (
                <div key={i.product.id} className="flex justify-between text-slate-600">
                  <span>{i.product.name} ({i.product.size}) × {i.quantity}</span>
                  <span>{formatNaira(i.product.pricePerCrate * i.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 font-bold flex justify-between">
                <span>Total Payable</span>
                <span>{formatNaira(subtotal + deposit)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCheckout(false)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm">Back to Cart</button>
              <button
                onClick={placeOrder}
                disabled={submitting || !order.name || !order.phone || !order.address}
                className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed */}
      {orderPlaced && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
            <p className="text-slate-500 mb-4">Your order has been received and will be processed shortly.</p>
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500">Order Number</p>
              <p className="text-2xl font-bold text-green-700">{orderPlaced.orderNo}</p>
              <p className="text-sm text-slate-500 mt-1">Total: <strong>{formatNaira(orderPlaced.total)}</strong></p>
            </div>
            <p className="text-sm text-slate-400 mb-6">Save your order number. Our team will contact you to confirm and arrange delivery.</p>
            <button onClick={() => setOrderPlaced(null)} className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-blue-800">Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}
