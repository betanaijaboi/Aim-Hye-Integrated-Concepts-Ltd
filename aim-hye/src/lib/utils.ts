export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateOrderNo() {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AH-${dateStr}-${rand}`;
}

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"] as const;

export const CATEGORIES = [
  { value: "lager", label: "Lager Beer" },
  { value: "stout", label: "Stout" },
  { value: "malt", label: "Malt Drink" },
  { value: "rtd", label: "Ready-to-Drink" },
  { value: "spirits", label: "Spirits" },
  { value: "wine", label: "Wine" },
];

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DISPATCHED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  LOADED: "bg-blue-100 text-blue-800",
  RETURNED: "bg-orange-100 text-orange-800",
  RECONCILED: "bg-green-100 text-green-800",
};
