"use client";
import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/utils";
import { getProductImage, CATEGORY_GRADIENTS } from "@/lib/productImages";
import { useCart, CartProduct } from "@/lib/useCart";
import { AimHyeLogo } from "@/components/AimHyeLogo";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { cart, addToCart, setItem } = useCart();

  const [product, setProduct] = useState<CartProduct | null>(null);
  const [siblings, setSiblings] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<"bottle" | "crate">("crate");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [flavor, setFlavor] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { router.replace("/"); return; }
        const { siblings: sibs, ...prod } = data;
        setProduct(prod);
        setSiblings(sibs ?? []);
        setLoading(false);
      });
  }, [id, router]);

  // Sync qty from cart when product loads or unit changes
  useEffect(() => {
    if (!product) return;
    const existing = cart.find((i) => i.product.id === product.id && i.unit === unit);
    if (existing) setQty(existing.quantity);
    else setQty(1);
  }, [product, unit, cart]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grad = CATEGORY_GRADIENTS[product.category] ?? CATEGORY_GRADIENTS.lager;
  const imgSrc = product.imageUrl || getProductImage(product.sku);

  // All variants including current product, grouped for the picker
  const allVariants = [product, ...siblings];
  const uniqueSizes = [...new Set(allVariants.map((v) => v.size))].sort((a, b) => {
    const toMl = (s: string) => parseFloat(s) * (s.includes("L") && !s.includes("cl") ? 1000 : 1);
    return toMl(a) - toMl(b);
  });
  const uniquePackaging = [...new Set(allVariants.map((v) => v.packaging))];
  const packagingLabels: Record<string, string> = { glass: "Glass Bottle", can: "Can", pet: "Plastic Bottle" };

  function navigateToVariant(size: string, packaging: string) {
    const target = allVariants.find((v) => v.size === size && v.packaging === packaging);
    if (target && target.id !== product.id) router.push(`/products/${target.id}`);
  }

  const showVariantPicker = siblings.length > 0;
  const inCartItem = cart.find((i) => i.product.id === product.id && i.unit === unit);
  const inCartAny = cart.filter((i) => i.product.id === product.id);
  const cartTotal = inCartAny.reduce((s, i) => s + i.quantity, 0);

  const maxQty = unit === "crate" ? product.stockCrates : product.stockCrates * product.packSize;
  const unitPrice = unit === "bottle" ? product.pricePerBottle : product.pricePerCrate;
  const lineDeposit = unit === "crate" ? product.depositPerCrate * qty : 0;
  const lineTotal = unitPrice * qty + lineDeposit;

  const catLabel =
    product.category === "rtd" ? "RTD" :
    product.category.charAt(0).toUpperCase() + product.category.slice(1);

  function changeQty(delta: number) {
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  }

  function handleAddToCart() {
    addToCart(product, qty, unit);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleUpdateCart() {
    setItem(product.id, unit, qty);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — matches storefront style */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: "rgba(28,28,30,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Back to Store</span>
          </button>
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow">
              <Image src="/uploads/aimhye-logo.jpg" alt="Aim-Hye" fill className="object-contain p-0.5" />
            </div>
            <div className="hidden sm:block">
              <AimHyeLogo className="h-4 w-auto text-white" />
              <p className="text-[10px] leading-tight" style={{ color: "#e0302a" }}>Integrated Concepts Limited</p>
            </div>
          </Link>
          <Link href="/" className="relative">
            <svg className="w-6 h-6 text-blue-200 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartTotal > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartTotal}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* LEFT — Product image */}
          <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-b ${grad.bg} flex items-center justify-center shadow-xl`} style={{ minHeight: 420 }}>
            {/* Fallback always visible; image layers on top */}
            <div className={`absolute inset-0 flex items-center justify-center text-8xl font-black opacity-20 select-none ${grad.text}`}>
              {product.brewery.shortName}
            </div>
            {imgSrc && (
              <Image
                src={imgSrc}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-6 drop-shadow-2xl"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="text-xs font-bold bg-white/90 text-slate-700 px-3 py-1 rounded-full shadow">
                {product.brewery.shortName}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full shadow ${
                product.category === "stout" ? "bg-slate-800 text-white" :
                product.category === "malt" ? "bg-yellow-600 text-white" :
                product.category === "spirits" ? "bg-purple-700 text-white" :
                product.category === "rtd" ? "bg-pink-600 text-white" :
                "bg-amber-600 text-white"
              }`}>{catLabel}</span>
            </div>
            {product.stockCrates <= 10 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                Only {product.stockCrates} crates left
              </div>
            )}
          </div>

          {/* RIGHT — Product details & purchase */}
          <div className="flex flex-col gap-6">
            {/* Name & meta */}
            <div>
              <p className="text-sm text-slate-500 font-medium">{product.brewery.name}</p>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mt-1">{product.name}</h1>
              <p className="text-slate-400 mt-1">{product.size} bottle · {product.packSize} bottles per crate</p>
              <div className="flex items-center gap-2 mt-3">
                <div className={`w-2 h-2 rounded-full ${product.stockCrates > 0 ? "bg-green-500" : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${product.stockCrates > 0 ? "text-green-600" : "text-red-600"}`}>
                  {product.stockCrates > 0
                    ? `${product.stockCrates} crates in stock (${product.stockCrates * product.packSize} bottles)`
                    : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Pricing info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Price per bottle</span>
                <span className="font-bold text-slate-800">{formatNaira(product.pricePerBottle)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Price per crate ({product.packSize} btls)</span>
                <span className="font-bold text-slate-800">{formatNaira(product.pricePerCrate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Bottle deposit (per crate, refundable)</span>
                <span className="font-medium text-slate-600">{formatNaira(product.depositPerCrate)}</span>
              </div>
              {product.packSize > 0 && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
                  Crate price saves {formatNaira(product.pricePerBottle * product.packSize - product.pricePerCrate)} vs buying individually
                </div>
              )}
            </div>

            {/* Variant picker — size and packaging */}
            {showVariantPicker && (
              <div className="space-y-4">
                {/* Size selector */}
                {uniqueSizes.length > 1 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map((size) => {
                        // Find the variant with this size + current packaging, or any variant with this size
                        const match = allVariants.find((v) => v.size === size && v.packaging === product.packaging)
                          ?? allVariants.find((v) => v.size === size);
                        const available = !!match && match.stockCrates > 0;
                        const isSelected = product.size === size;
                        return (
                          <button
                            key={size}
                            onClick={() => match && navigateToVariant(size, product.packaging) || (match && router.push(`/products/${match.id}`))}
                            disabled={!available}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                                : available
                                ? "border-slate-200 bg-white text-slate-700 hover:border-[#1e3a5f]"
                                : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Packaging selector */}
                {uniquePackaging.length > 1 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Packaging</p>
                    <div className="flex flex-wrap gap-2">
                      {uniquePackaging.map((pkg) => {
                        const match = allVariants.find((v) => v.size === product.size && v.packaging === pkg)
                          ?? allVariants.find((v) => v.packaging === pkg);
                        const available = !!match && match.stockCrates > 0;
                        const isSelected = product.packaging === pkg;
                        const PackagingIcon = () => {
                          if (pkg === "can") return (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zM8 7h8M8 17h8" />
                            </svg>
                          );
                          if (pkg === "pet") return (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 2h6l1 5v1a5 5 0 01-10 0V7L9 2zM7 19c0 1.657 2.239 3 5 3s5-1.343 5-3" />
                            </svg>
                          );
                          return (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3h6l1 4v1a5 5 0 01-10 0V7L9 3zM9 8h6" />
                            </svg>
                          );
                        };
                        return (
                          <button
                            key={pkg}
                            onClick={() => match && router.push(`/products/${match.id}`)}
                            disabled={!available}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                                : available
                                ? "border-slate-200 bg-white text-slate-700 hover:border-[#1e3a5f]"
                                : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            <PackagingIcon />
                            {packagingLabels[pkg] ?? pkg}
                            {!available && <span className="text-xs font-normal">(Out of stock)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Packaging detail */}
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
                  product.packaging === "glass" ? "bg-blue-50 text-blue-700" :
                  product.packaging === "can"   ? "bg-slate-100 text-slate-600" :
                                                  "bg-green-50 text-green-700"
                }`}>
                  <span className="font-semibold capitalize">{packagingLabels[product.packaging] ?? product.packaging}</span>
                  <span>·</span>
                  <span>
                    {product.packaging === "glass" ? "Returnable — bottle deposit applies" :
                     product.packaging === "can"   ? "No deposit · Recyclable aluminium" :
                                                     "No deposit · Sealed plastic"}
                  </span>
                </div>
              </div>
            )}

            {/* Flavor picker — Fayrouz (Assorted) only */}
            {product.productFamily === "fayrouz-strawberry" && (() => {
              const FLAVORS = [
                { key: "peach",      label: "Peach",      color: "#f97316", bg: "#fff7ed" },
                { key: "pineapple",  label: "Pineapple",  color: "#eab308", bg: "#fefce8" },
                { key: "watermelon", label: "Watermelon", color: "#22c55e", bg: "#f0fdf4" },
                { key: "apple",      label: "Apple",      color: "#84cc16", bg: "#f7fee7" },
              ];
              return (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Flavour</p>
                  <div className="flex flex-wrap gap-2">
                    {FLAVORS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFlavor(flavor === f.key ? null : f.key)}
                        className="px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                        style={flavor === f.key
                          ? { borderColor: f.color, background: f.color, color: "#fff" }
                          : { borderColor: "#e2e8f0", background: f.bg, color: f.color }
                        }
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {!flavor && (
                    <p className="text-xs text-slate-400 mt-2">Select a flavour preference (optional)</p>
                  )}
                </div>
              );
            })()}

            {/* Unit toggle */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">I want to buy by...</p>
              <div className="grid grid-cols-2 gap-3">
                {(["bottle", "crate"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => { setUnit(u); setQty(1); }}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      unit === u
                        ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-lg"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-1 flex items-center justify-center">
                      {u === "bottle" ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3h6l1 4v1a5 5 0 01-10 0V7L9 3zM9 8h6M7 16c0 2.21 2.239 4 5 4s5-1.79 5-4" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <p className="font-bold capitalize">{u}</p>
                    <p className="text-xs mt-0.5 opacity-75">
                      {u === "bottle" ? `${formatNaira(product.pricePerBottle)} each` : `${formatNaira(product.pricePerCrate)} / ${product.packSize} btls`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Quantity</p>
                <p className="text-xs text-slate-400">
                  Max: {maxQty} {unit}s
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => changeQty(-1)}
                  disabled={qty <= 1}
                  className="w-12 h-12 rounded-2xl border-2 border-slate-200 flex items-center justify-center text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-30 transition-all text-xl font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1;
                    setQty(Math.min(maxQty, Math.max(1, v)));
                  }}
                  className="w-20 h-12 text-center text-xl font-extrabold text-slate-900 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={() => changeQty(1)}
                  disabled={qty >= maxQty}
                  className="w-12 h-12 rounded-2xl bg-[#1e3a5f] text-white flex items-center justify-center hover:bg-blue-800 disabled:opacity-30 transition-all text-xl font-bold"
                >
                  +
                </button>
                <div className="text-sm text-slate-500">
                  {unit === "bottle"
                    ? `= ${(qty / product.packSize).toFixed(1)} crates`
                    : `= ${qty * product.packSize} bottles`}
                </div>
              </div>

              {/* Quick quantity shortcuts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {(unit === "crate" ? [1, 2, 5, 10, 20, 50] : [1, 6, 12, 24, 48]).map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(Math.min(maxQty, n))}
                    disabled={n > maxQty}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-30 ${
                      qty === n
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{qty} {unit}{qty > 1 ? "s" : ""} × {formatNaira(unitPrice)}</span>
                <span className="font-semibold">{formatNaira(unitPrice * qty)}</span>
              </div>
              {lineDeposit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bottle deposit (refundable)</span>
                  <span className="font-semibold">{formatNaira(lineDeposit)}</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-2 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-extrabold text-xl text-amber-400">{formatNaira(lineTotal)}</span>
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3">
              {inCartItem ? (
                <>
                  <button
                    onClick={handleUpdateCart}
                    className="flex-1 border-2 border-[#1e3a5f] text-[#1e3a5f] py-4 rounded-2xl font-bold hover:bg-blue-50 transition-colors"
                  >
                    Update Cart
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-bold transition-colors"
                  >
                    Add More
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={product.stockCrates === 0}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${
                    added
                      ? "bg-green-500 text-white"
                      : "bg-[#1e3a5f] hover:bg-blue-800 text-white disabled:opacity-40"
                  }`}
                >
                  {added ? "✓ Added to Cart!" : product.stockCrates === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              )}
            </div>

            {/* Cart summary if items in cart */}
            {inCartAny.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">In your cart:</p>
                {inCartAny.map((i) => (
                  <div key={i.unit} className="flex justify-between text-sm text-amber-700">
                    <span>{i.quantity} {i.unit}{i.quantity > 1 ? "s" : ""} of {product.name}</span>
                    <span className="font-bold">
                      {formatNaira((i.unit === "bottle" ? product.pricePerBottle : product.pricePerCrate) * i.quantity)}
                    </span>
                  </div>
                ))}
                <Link
                  href="/"
                  className="mt-3 flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  View Cart & Checkout →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
