"use client";
import { useState, useEffect } from "react";

export interface CartProduct {
  id: string; sku: string; name: string; size: string; category: string;
  packaging: string; productFamily?: string | null;
  pricePerCrate: number; pricePerBottle: number; depositPerCrate: number;
  stockCrates: number; packSize: number; imageUrl?: string | null;
  brewery: { name: string; shortName: string };
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  unit: "bottle" | "crate";
}

const CART_KEY = "aimhye_cart_v2";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  function addToCart(product: CartProduct, quantity: number, unit: "bottle" | "crate") {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.unit === unit);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.unit === unit
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, unit }];
    });
  }

  function setItem(productId: string, unit: "bottle" | "crate", quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => !(i.product.id === productId && i.unit === unit)));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId && i.unit === unit ? { ...i, quantity } : i))
      );
    }
  }

  function removeItem(productId: string, unit: "bottle" | "crate") {
    setCart((prev) => prev.filter((i) => !(i.product.id === productId && i.unit === unit)));
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem(CART_KEY);
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce(
    (s, i) => s + (i.unit === "bottle" ? i.product.pricePerBottle : i.product.pricePerCrate) * i.quantity,
    0
  );
  const deposit = cart.reduce(
    (s, i) => s + (i.unit === "crate" ? i.product.depositPerCrate * i.quantity : 0),
    0
  );

  return { cart, addToCart, setItem, removeItem, clearCart, cartCount, subtotal, deposit, loaded };
}
