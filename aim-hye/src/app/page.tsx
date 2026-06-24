"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { formatNaira } from "@/lib/utils";
import { getProductImage, CATEGORY_GRADIENTS } from "@/lib/productImages";
import { useCart, CartProduct } from "@/lib/useCart";
import Link from "next/link";
import { AimHyeLogo } from "@/components/AimHyeLogo";

type Product = CartProduct; // includes packaging, productFamily
interface Customer { id: string; name: string; phone: string; email?: string; hasPin: boolean }

const BREWERIES = ["All", "Champion Breweries", "International Breweries", "Nigerian Breweries", "Guinness Nigeria"];
const CATS = ["All", "lager", "stout", "malt", "rtd", "spirits"];
const catLabels: Record<string, string> = { lager: "Lager", stout: "Stout", malt: "Malt", rtd: "RTD", spirits: "Spirits" };

const BRANCHES = [
  { key: "IKOT_EKPENE", label: "Ikot Ekpene Branch", sub: "Ikot Ekpene, Akwa Ibom" },
  { key: "ITAM",        label: "Itam Branch",         sub: "Itam, Uyo, Akwa Ibom" },
] as const;

function getBranchCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)aim_branch=([^;]+)/);
  return m ? m[1] : null;
}
function setBranchCookie(branch: string) {
  document.cookie = `aim_branch=${branch};path=/;max-age=${60 * 60 * 24 * 30}`;
}

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { cart, addToCart, setItem, clearCart, cartCount, subtotal, deposit } = useCart();
  const [brewery, setBrewery] = useState("All");
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // Guest checkout fields
  const [guestInfo, setGuestInfo] = useState({ name: "", phone: "", address: "", notes: "" });
  // Auth checkout
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK_CARD" | "BANK_TRANSFER">("PAYSTACK_CARD");
  const [pinInput, setPinInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderNo: string; total: number; orderId?: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    const saved = getBranchCookie();
    if (saved) {
      setBranch(saved);
    } else {
      setShowBranchPicker(true);
    }
    fetch("/api/customer/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.customer) setCustomer(data.customer); });
  }, []);

  useEffect(() => {
    if (!branch) return;
    setLoadingProducts(true);
    fetch(`/api/products?active=true&branch=${branch}`)
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(data.filter((p) => p.stockCrates > 0));
        setLoadingProducts(false);
      });
  }, [branch]);

  function selectBranch(b: string) {
    setBranchCookie(b);
    setBranch(b);
    setShowBranchPicker(false);
  }

  const filtered = products.filter((p) => {
    const matchBrew = brewery === "All" || p.brewery.name === brewery;
    const matchCat = cat === "All" || p.category === cat;
    const matchSearch = `${p.name} ${p.brewery.name}`.toLowerCase().includes(search.toLowerCase());
    return matchBrew && matchCat && matchSearch;
  });

  // Deduplicate by productFamily — collapse same-drink variants into one card
  const familyMap = new Map<string, Product[]>();
  for (const p of filtered) {
    const key = p.productFamily || p.id;
    if (!familyMap.has(key)) familyMap.set(key, []);
    familyMap.get(key)!.push(p);
  }
  const productGroups = Array.from(familyMap.values()).map((group) => {
    const sorted = [...group].sort((a, b) => {
      const sA = parseInt(a.size) || 0, sB = parseInt(b.size) || 0;
      if (sB !== sA) return sB - sA;
      const order = (x: Product) => x.packaging === "glass" ? 0 : x.packaging === "can" ? 1 : 2;
      return order(a) - order(b);
    });
    const sizes = Array.from(new Set(sorted.map((v) => v.size))).sort((a, b) => parseInt(b) - parseInt(a));
    const hasVariants = sizes.length > 1 || sorted.some((v) => v.packaging !== sorted[0].packaging);
    return { rep: sorted[0], all: sorted, sizes, hasVariants };
  });

  function quickAddToCart(product: Product) {
    addToCart(product, 1, "crate");
  }

  function updateQty(id: string, qty: number) {
    // storefront grid always shows crate unit for quick-add
    const item = cart.find((i) => i.product.id === id && i.unit === "crate");
    setItem(id, item?.unit ?? "crate", qty);
  }

  // Guest checkout (existing /api/orders flow)
  async function placeGuestOrder() {
    setSubmitting(true);
    setCheckoutError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { name: guestInfo.name, phone: guestInfo.phone, address: guestInfo.address },
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unit: i.unit })),
        deliveryAddress: guestInfo.address,
        notes: guestInfo.notes,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setOrderPlaced({ orderNo: data.orderNo, total: data.totalAmount + data.depositAmount });
      clearCart();
      setShowCheckout(false);
    } else {
      setCheckoutError(data.error || "Order failed");
    }
  }

  // Authenticated checkout
  const placeAuthOrder = useCallback(async () => {
    setSubmitting(true);
    setCheckoutError("");

    // Create the order
    const orderRes = await fetch("/api/customer/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unit: i.unit })),
        deliveryAddress,
        paymentMethod,
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      setCheckoutError(orderData.error || "Failed to create order");
      setSubmitting(false);
      return;
    }

    const { orderId, orderNo, totalPayable, paystackRef } = orderData;

    if (paymentMethod === "PAYSTACK_CARD" && paystackRef) {
      // Launch Paystack popup
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!publicKey || publicKey.includes("YOUR_")) {
        setCheckoutError("Paystack not configured. Please contact the store.");
        setSubmitting(false);
        return;
      }

      // Verify PIN before payment if customer has one
      if (customer?.hasPin && pinInput.length === 4) {
        const pinRes = await fetch("/api/customer/pin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pinInput }),
        });
        if (!pinRes.ok) {
          setCheckoutError("Incorrect PIN");
          setSubmitting(false);
          return;
        }
      }

      // @ts-expect-error PaystackPop injected via script
      const handler = window.PaystackPop?.setup({
        key: publicKey,
        email: customer?.email || `${customer?.phone}@aimhye.com`,
        amount: totalPayable * 100, // kobo
        ref: paystackRef,
        metadata: { custom_fields: [{ display_name: "Order No", variable_name: "order_no", value: orderNo }] },
        onSuccess: async (transaction: { reference: string }) => {
          // Verify payment
          await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: transaction.reference }),
          });
          setOrderPlaced({ orderNo, total: totalPayable, orderId });
          clearCart();
          setShowCheckout(false);
          setSubmitting(false);
        },
        onCancel: () => {
          setCheckoutError("Payment cancelled. Your order is saved — you can pay later.");
          setSubmitting(false);
        },
      });
      handler?.openIframe();
    } else {
      // Bank transfer — order saved, show confirmation
      setOrderPlaced({ orderNo, total: totalPayable, orderId });
      clearCart();
      setShowCheckout(false);
      setSubmitting(false);
    }
  }, [cart, customer, deliveryAddress, paymentMethod, pinInput]);

  const branchInfo = BRANCHES.find((b) => b.key === branch);

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      {/* Paystack script */}
      <script async src="https://js.paystack.co/v1/inline.js" />

      {/* Branch picker overlay — always mounted, fades in/out */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: showBranchPicker ? "blur(8px)" : "none",
          WebkitBackdropFilter: showBranchPicker ? "blur(8px)" : "none",
          opacity: showBranchPicker ? 1 : 0,
          pointerEvents: showBranchPicker ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className="w-full max-w-sm"
          style={{
            transform: showBranchPicker ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
            transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-2xl mb-4">
                <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-1" />
              </div>
              <AimHyeLogo className="h-10 w-auto text-white" />
              <p className="text-sm mt-0.5" style={{ color: "#e0302a" }}>Integrated Concepts Limited</p>
            </div>
            <p className="text-white/70 text-center text-sm mb-5">Select your nearest branch to continue</p>
            <div className="space-y-3">
              {BRANCHES.map((b) => {
                const isHovered = hoveredBranch === b.key;
                const otherHovered = hoveredBranch !== null && hoveredBranch !== b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => selectBranch(b.key)}
                    onMouseEnter={() => setHoveredBranch(b.key)}
                    onMouseLeave={() => setHoveredBranch(null)}
                    className="w-full rounded-2xl p-5 text-left shadow-xl transition-all duration-200"
                    style={{
                      background: isHovered ? "#1c1c1e" : otherHovered ? "rgba(255,255,255,0.5)" : "#fff",
                      transform: isHovered ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                        style={{ background: isHovered ? "#e0302a" : "#1c1c1e" }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold transition-colors duration-200" style={{ color: isHovered ? "#fff" : otherHovered ? "rgba(30,30,30,0.4)" : "#1e293b" }}>{b.label}</p>
                        <p className="text-xs mt-0.5 transition-colors duration-200" style={{ color: isHovered ? "rgba(255,255,255,0.6)" : otherHovered ? "rgba(30,30,30,0.25)" : "#94a3b8" }}>{b.sub}</p>
                      </div>
                      <svg className="w-5 h-5 ml-auto transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isHovered ? "rgba(255,255,255,0.5)" : otherHovered ? "rgba(30,30,30,0.2)" : "#cbd5e1" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: "rgba(28,28,30,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow">
              <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-0.5" />
            </div>
            <div>
              <AimHyeLogo className="h-5 w-auto text-white" />
              <p className="text-[11px] leading-tight" style={{ color: "#e0302a" }}>Integrated Concepts Limited</p>
            </div>
          </div>
          {/* Branch pill */}
          {branchInfo && (
            <button
              onClick={() => setShowBranchPicker(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border border-white/20 hover:border-white/40"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {branchInfo.label}
              <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {/* Nav right */}
          <div className="flex items-center gap-3">
            {customer ? (
              <Link href="/account" className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#e0302a" }}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-white/80">{customer.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link href="/account/login" className="text-white/70 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40">Sign In</Link>
            )}
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ background: "#e0302a" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ color: "#e0302a" }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="text-white py-16 px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1c1c1e 0%, #2d2d2f 50%, #1c1c1e 100%)" }}>
        {/* Red accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #e0302a, transparent)" }} />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#e0302a" }}>Certified Distributor · Nigeria</p>
            <h1 className="text-4xl font-black leading-tight tracking-tight mb-3">Order Your Favourite<br /><span style={{ color: "#e0302a" }}>Drinks</span></h1>
            <p className="text-white/50 text-sm">Champion · International · Nigerian · Guinness Breweries</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Lager", "Stout", "Malt", "RTD", "Spirits"].map((b) => (
              <span key={b} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 text-white/70">{b}</span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #e0302a44, transparent)" }} />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
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
                className={`text-xs px-3 py-2 rounded-xl border transition-all font-medium ${brewery === b ? "text-white border-transparent" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}
                style={brewery === b ? { background: "#1c1c1e", borderColor: "#1c1c1e" } : {}}
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
                className={`text-xs px-3 py-2 rounded-xl border transition-all font-medium capitalize ${cat === c ? "text-white border-transparent" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}
                style={cat === c ? { background: "#e0302a", borderColor: "#e0302a" } : {}}
              >
                {c === "All" ? "All Types" : catLabels[c] || c}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid — deduplicated by productFamily */}
        <div
          className="transition-opacity duration-300"
          style={{ opacity: loadingProducts ? 0.3 : 1, pointerEvents: loadingProducts ? "none" : "auto" }}
        >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-6">
          {productGroups.map(({ rep: p, all, sizes, hasVariants }, gridIndex) => {
                const inCart = cart.find((i) => i.product.id === p.id && i.unit === "crate");
                const imgSrc = p.imageUrl || getProductImage(p.sku);
                const grad = CATEGORY_GRADIENTS[p.category] ?? CATEGORY_GRADIENTS.lager;
                const catLabel = p.category === "rtd" ? "RTD" : p.category.charAt(0).toUpperCase() + p.category.slice(1);
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden flex flex-col border border-slate-100 group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  >
                    {/* Image area — click to go to product page */}
                    <Link href={`/products/${p.id}`} className={`relative block bg-gradient-to-b ${grad.bg} overflow-hidden`} style={{ height: 200 }}>
                      <div className={`absolute inset-0 flex items-center justify-center ${grad.text} text-4xl font-black opacity-20 select-none tracking-widest`}>
                        {p.brewery.shortName}
                      </div>
                      {imgSrc && (
                        <Image
                          src={imgSrc}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          priority={gridIndex < 8}
                          className={`group-hover:scale-105 transition-transform duration-300 ${["INTL-FLYF-33","INTL-CASTL-33","INTL-BUD-33","INTL-BUDR-33","GUIN-SATZ-60"].includes(p.sku) ? "object-cover" : "object-contain p-2 drop-shadow-lg"}`}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="text-[10px] font-bold bg-white/90 text-slate-700 px-2 py-0.5 rounded-full shadow-sm leading-tight">
                          {p.brewery.shortName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm leading-tight ${
                          p.category === "stout" ? "bg-slate-800 text-slate-100" :
                          p.category === "malt" ? "bg-yellow-600 text-white" :
                          p.category === "spirits" ? "bg-purple-700 text-white" :
                          p.category === "rtd" ? "bg-pink-600 text-white" :
                          "bg-amber-600 text-white"
                        }`}>{catLabel}</span>
                      </div>
                      {p.stockCrates <= 10 && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                          Only {p.stockCrates} left
                        </span>
                      )}
                      {/* Size pills overlay at bottom of image — show all available sizes */}
                      {hasVariants && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 flex-wrap px-2">
                          {sizes.map((sz) => (
                            <span key={sz} className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow border ${sz === p.size ? "bg-white text-slate-800 border-white" : "bg-white/30 text-white border-white/50"}`}>
                              {sz}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>

                    {/* Info area */}
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <Link href={`/products/${p.id}`} className="hover:text-blue-700 transition-colors">
                        {/* Strip size from name if the family has multiple sizes */}
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">
                          {hasVariants ? p.name.replace(/\s*\d+cl\s*/i, "").trim() : p.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-400">
                        {hasVariants ? `${sizes.join(" / ")} · tap to choose` : `${p.size} · ${p.packSize} bottles/crate`}
                      </p>

                      <div className="mt-1">
                        <p className="text-lg font-extrabold text-[#1e3a5f] leading-tight">
                          {hasVariants ? `From ${formatNaira(Math.min(...all.map((v) => v.pricePerCrate)))}` : formatNaira(p.pricePerCrate)}
                          <span className="text-xs font-normal text-slate-400 ml-1">/crate</span>
                        </p>
                        {!hasVariants && (
                          <p className="text-[11px] text-slate-400">
                            {formatNaira(p.pricePerBottle)}/btl · +{formatNaira(p.depositPerCrate)} deposit
                          </p>
                        )}
                      </div>

                      {p.stockCrates > 10 && (
                        <p className="text-[11px] text-green-600 font-medium">{p.stockCrates} crates available</p>
                      )}

                      <div className="mt-auto pt-2">
                        {hasVariants ? (
                          <Link
                            href={`/products/${p.id}`}
                            className="w-full block text-center text-white text-xs py-2.5 rounded-xl transition-all font-semibold tracking-wide hover:opacity-90 active:opacity-80"
                            style={{ background: "#e0302a" }}
                          >
                            Choose Size
                          </Link>
                        ) : inCart ? (
                          <div className="flex items-center justify-between gap-1 bg-slate-50 rounded-xl px-2 py-1.5">
                            <button
                              onClick={() => updateQty(p.id, inCart.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors font-bold text-lg leading-none"
                            >
                              −
                            </button>
                            <span className="font-bold text-slate-800 text-sm min-w-6 text-center">{inCart.quantity} cr</span>
                            <button
                              onClick={() => updateQty(p.id, inCart.quantity + 1)}
                              disabled={inCart.quantity >= p.stockCrates}
                              className="w-8 h-8 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center hover:bg-[#2d2d2f] disabled:opacity-40 transition-colors font-bold text-lg leading-none"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => quickAddToCart(p)}
                            className="w-full bg-[#1c1c1e] hover:bg-[#2d2d2f] active:bg-blue-900 text-white text-xs py-2.5 rounded-xl transition-colors font-semibold tracking-wide"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-500">No products found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
        </div>{/* end opacity wrapper */}
      </div>

      {/* Footer */}
      <footer className="text-white mt-16 py-10 px-4 border-t border-white/10" style={{ background: "#1c1c1e" }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white mx-auto mb-3 shadow">
            <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-1" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <AimHyeLogo className="h-6 w-auto text-white" />
            <span className="text-sm tracking-wide" style={{ color: "#e0302a" }}>Integrated Concepts Limited</span>
          </div>
          <p className="text-white/40 text-xs mt-2">Authorized distributor — Champion · International · Nigerian · Guinness Breweries</p>
          <p className="text-white/30 text-xs mt-1">Orders processed within 24 hours · Delivery available in your area</p>
          <div className="mt-5 flex justify-center gap-5 text-xs text-white/40">
            <Link href="/account/login" className="hover:text-white transition-colors">Customer Login</Link>
            <span>·</span>
            <Link href="/account/register" className="hover:text-white transition-colors">Create Account</Link>
            <span>·</span>
            <Link href="/login" className="hover:text-white transition-colors">Staff Login</Link>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Your Cart ({cartCount} crates)</h2>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => {
                  const unitPrice = item.unit === "bottle" ? item.product.pricePerBottle : item.product.pricePerCrate;
                  const unitLabel = item.unit === "bottle" ? "btl" : "crate";
                  return (
                  <div key={`${item.product.id}-${item.unit}`} className="flex items-center gap-4 bg-slate-50 rounded-xl p-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{item.product.name} ({item.product.size})</p>
                      <p className="text-xs text-slate-400">{item.product.brewery.shortName} · {formatNaira(unitPrice)}/{unitLabel}</p>
                      <p className="text-sm font-bold text-[#1e3a5f]">{formatNaira(unitPrice * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setItem(item.product.id, item.unit, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center text-slate-600 hover:bg-slate-200">-</button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity} {unitLabel}</span>
                      <button onClick={() => setItem(item.product.id, item.unit, item.quantity + 1)} className="w-7 h-7 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center">+</button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{formatNaira(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bottle Deposit (refundable)</span><span className="font-medium">{formatNaira(deposit)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Total Payable</span><span>{formatNaira(subtotal + deposit)}</span></div>
                </div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
                  Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Complete Your Order</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {checkoutError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{checkoutError}</div>
            )}

            {/* Order summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <p className="font-semibold text-slate-700 mb-2">Order Summary</p>
              {cart.map((i) => (
                <div key={i.product.id} className="flex justify-between text-slate-600">
                  <span>{i.product.name} ({i.product.size}) × {i.quantity}</span>
                  <span>{formatNaira(i.product.pricePerCrate * i.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <div className="flex justify-between text-slate-500"><span>Bottle Deposit</span><span>{formatNaira(deposit)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total Payable</span><span className="text-[#1e3a5f]">{formatNaira(subtotal + deposit)}</span></div>
              </div>
            </div>

            {customer ? (
              /* Authenticated checkout */
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Signed in as <strong>{customer.name}</strong>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "PAYSTACK_CARD", label: "Card / Transfer", sub: "Powered by Paystack" },
                      { value: "BANK_TRANSFER", label: "Bank Transfer", sub: "Manual bank payment" },
                    ] as const).map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-colors ${paymentMethod === m.value ? "border-[#1e3a5f] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <p className="font-medium text-slate-800 text-sm">{m.label}</p>
                        <p className="text-xs text-slate-400">{m.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="rounded-xl p-4 text-sm border" style={{ background: "rgba(28,28,30,0.04)", borderColor: "rgba(28,28,30,0.12)" }}>
                    <p className="font-bold text-slate-800 mb-3">Transfer To</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-xs">Bank</p>
                        <div className="flex items-center gap-2">
                          <Image src="/uploads/fcmb-logo.png" alt="FCMB" width={20} height={20} className="rounded" />
                          <p className="font-semibold text-slate-800 text-xs">First City Monument Bank</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-xs">Account Name</p>
                        <p className="font-semibold text-slate-800 text-xs">Aim-Hye Integrated Concepts Limited</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
                        <p className="text-slate-500 text-xs">Account Number</p>
                        <p className="font-black text-lg tracking-widest" style={{ color: "#1c1c1e" }}>
                          {branch === "ITAM" ? "2001190071" : "8982379016"}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1">
                        {branch === "ITAM" ? "Itam Branch" : "Ikot Ekpene Branch"} · Use your order number as narration after placing the order.
                      </p>
                    </div>
                  </div>
                )}

                {customer.hasPin && paymentMethod === "PAYSTACK_CARD" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transaction PIN (for security)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-32 border border-slate-300 rounded-xl px-4 py-2 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowCheckout(false); setShowCart(true); }} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm">Back to Cart</button>
                  <button
                    onClick={placeAuthOrder}
                    disabled={submitting || !deliveryAddress || (customer.hasPin && paymentMethod === "PAYSTACK_CARD" && pinInput.length < 4)}
                    className="flex-1 bg-[#1c1c1e] text-white py-2.5 rounded-xl font-semibold hover:bg-[#2d2d2f] disabled:opacity-60"
                  >
                    {submitting ? "Processing..." : paymentMethod === "PAYSTACK_CARD" ? "Pay Now" : "Place Order"}
                  </button>
                </div>
              </div>
            ) : (
              /* Guest checkout */
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  <Link href="/account/login" className="font-semibold underline">Sign in</Link> for faster checkout, order tracking, and online payment.
                </div>
                {[
                  { label: "Full Name *", key: "name", type: "text" },
                  { label: "Phone Number *", key: "phone", type: "tel" },
                  { label: "Delivery Address *", key: "address", type: "text" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={guestInfo[f.key as keyof typeof guestInfo]}
                      onChange={(e) => setGuestInfo({ ...guestInfo, [f.key]: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea value={guestInfo.notes} onChange={(e) => setGuestInfo({ ...guestInfo, notes: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none" rows={2} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setShowCheckout(false); setShowCart(true); }} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm">Back</button>
                  <button
                    onClick={placeGuestOrder}
                    disabled={submitting || !guestInfo.name || !guestInfo.phone || !guestInfo.address}
                    className="flex-1 bg-[#1c1c1e] text-white py-2.5 rounded-xl font-semibold hover:bg-[#2d2d2f] disabled:opacity-60"
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmed */}
      {orderPlaced && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
            <p className="text-slate-500 mb-4">Your order has been received and will be processed shortly.</p>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-500">Order Number</p>
              <p className="text-2xl font-bold text-green-700">{orderPlaced.orderNo}</p>
              <p className="text-sm text-slate-500 mt-1">Total: <strong>{formatNaira(orderPlaced.total)}</strong></p>
            </div>
            {orderPlaced.orderId && (
              <a
                href={`/api/invoices?orderId=${orderPlaced.orderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors mb-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Invoice
              </a>
            )}
            <p className="text-sm text-slate-400 mb-5">Our team will contact you to arrange delivery.</p>
            <button onClick={() => setOrderPlaced(null)} className="w-full bg-[#1c1c1e] text-white py-3 rounded-xl font-semibold hover:bg-[#2d2d2f]">Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}
