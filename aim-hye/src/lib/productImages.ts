// Real bottle/product image URLs mapped by SKU.
// NB images: official nbplc.com CDN (stable, high quality)
// Guinness/others: brand CDNs or Untappd where confirmed
// Fallback is handled by category in the UI via onError

const PRODUCT_IMAGES: Record<string, string> = {
  // ── Nigerian Breweries ──────────────────────────────────────────────────
  "NB-STAR-60":    "/uploads/star-lager.png",
  "NB-STAR-33":    "/uploads/star-lager.png",
  "NB-STARLITE-33":"https://www.nbplc.com/wp-content/uploads/2021/08/star-lite-bottle-new-324x324.png",
  "NB-STARRAD-33": "/uploads/star-radler.png",
  "NB-HEI-60":     "https://www.nbplc.com/wp-content/uploads/2021/08/heineken-bottle-new-324x324.png",
  "NB-HEI-33":     "https://www.nbplc.com/wp-content/uploads/2021/08/heineken-bottle-new-324x324.png",
  "NB-GULD-60":    "https://www.nbplc.com/wp-content/uploads/2021/08/gulder-bottle-new-324x324.png",
  "NB-GULD-33":    "https://www.nbplc.com/wp-content/uploads/2021/08/gulder-bottle-new-324x324.png",
  "NB-GOLDB-60":   "https://www.nbplc.com/wp-content/uploads/2021/08/goldberg-bottle-new2-324x324.png",
  "NB-MORE-60":    "/uploads/more-lager.png",
  "NB-LEGEND-60":  "https://www.nbplc.com/wp-content/uploads/2021/08/legend-bottle-new-324x324.png",
  "NB-TURBO-60":   "/uploads/turbo-king.png",
  "NB-33EXP-33":   "https://www.nbplc.com/wp-content/uploads/2021/08/33-export-bottle-new2-324x324.png",
  "NB-DESP-33":    "https://www.nbplc.com/wp-content/uploads/2021/08/Desperados-324x324.jpg",
  "NB-TIGER-33":   "/uploads/tiger-lager.png",
  "NB-MALTI-33":   "https://www.nbplc.com/wp-content/uploads/2021/08/maltina-pineapple-bottle-new-324x324.png",
  "NB-AMSTM-33":   "/uploads/amstel-malta.avif",
  "NB-AMSTMU-33":  "/uploads/amstel-malta.avif",
  "NB-FAYRP-33":   "https://www.nbplc.com/wp-content/uploads/2021/08/fayrouz-bottle-new-285x324.png",
  "NB-FAYRS-33":   "https://www.nbplc.com/wp-content/uploads/2021/08/fayrouz-strawberry-bottle-new-285x324.png",
  "NB-FAYRP-50-PET": "https://www.nbplc.com/wp-content/uploads/2021/08/fayrouz-bottle-new-285x324.png",
  "NB-FAYRS-50-PET": "https://www.nbplc.com/wp-content/uploads/2021/08/fayrouz-strawberry-bottle-new-285x324.png",

  // Can variants — same brand visual, brewery provides can imagery
  "NB-STAR-33-CAN":    "/uploads/star-lager.png",
  "NB-HEI-33-CAN":     "https://www.nbplc.com/wp-content/uploads/2021/08/heineken-bottle-new-324x324.png",
  "NB-MALTI-33-CAN":   "https://www.nbplc.com/wp-content/uploads/2021/08/maltina-pineapple-bottle-new-324x324.png",
  "GUIN-FES-33-CAN":   "/uploads/guinness-fes.png",
  "GUIN-MALT-33-CAN":  "/uploads/malta-guinness.png",
  "NB-HIMALT-33":  "/uploads/hi-malt.png",
  "NB-MALTG-33":   "/uploads/malta-gold.png",

  // ── Guinness Nigeria ────────────────────────────────────────────────────
  "GUIN-FES-60":   "/uploads/guinness-fes.png",
  "GUIN-ES-60":    "/uploads/guinness-extra-smooth.png",
  "GUIN-HARP-60":  "/uploads/harp-lager.png",
  "GUIN-HARP-33":  "/uploads/harp-lager.png",
  "GUIN-SATZ-60":  "/uploads/satzenbrau.avif",
  "GUIN-DUBM-33":  "/uploads/dubic-malt.png",
  "GUIN-MALT-33":  "/uploads/malta-guinness.png",
  "GUIN-MALTH-33": "/uploads/malta-guinness.png",
  "GUIN-ORIJ-33":  "/uploads/orijin-v2.png",
  "GUIN-ORIJZ-33": "https://assets.untappd.com/site/beer_logos/beer-2291882_e3b63_sm.jpeg",
  "GUIN-SMIRN-33": "/uploads/smirnoff-ice.png",
  "GUIN-GORDN-75": "/uploads/gordons-gin.png",

  // ── International Breweries (AB InBev) ──────────────────────────────────
  "INTL-TROPH-60": "/uploads/trophy-lager.png",
  "INTL-TROPH-33": "/uploads/trophy-lager.png",
  "INTL-TRST-60":  "/uploads/trophy-stout.png",
  "INTL-HERO-60":  "/uploads/hero-lager.png",
  "INTL-HERO-33":  "/uploads/hero-lager.png",
  "INTL-BUD-33":   "/uploads/budweiser.png",
  "INTL-BUDR-33":  "/uploads/budweiser-royale.png",
  "INTL-CASTL-33": "/uploads/castle-lite.png",
  "INTL-FLYF-33":  "/uploads/flying-fish.png",
  "INTL-EAGLE-60": "/uploads/eagle-lager.png",
  "INTL-EAGST-60": "/uploads/eagle-lager.png",
  "INTL-GRMALT-33":"/uploads/grand-malt.png",
  "INTL-BETM-33":  "/uploads/betamalt.png",

  // ── Champion Breweries ───────────────────────────────────────────────────
  "CHAMP-LAG-60":  "/uploads/champ-lager-60cl.png",
  "CHAMP-LAG-33":  "/uploads/champ-lager-60cl.png",
  "CHAMP-GING-33": "/uploads/champ-ginger-60cl.png",
  // Local image — save the bottle photo to public/uploads/champ-malta-33cl.jpg
  "CHAMP-MALT-33": "/uploads/champ-malta-33cl.png",
};

export function getProductImage(sku: string): string | null {
  return PRODUCT_IMAGES[sku] ?? null;
}

export const CATEGORY_GRADIENTS: Record<string, { bg: string; text: string }> = {
  lager:   { bg: "from-amber-800 to-amber-600",   text: "text-amber-100" },
  stout:   { bg: "from-slate-900 to-slate-700",   text: "text-slate-100" },
  malt:    { bg: "from-yellow-700 to-yellow-500", text: "text-yellow-100" },
  rtd:     { bg: "from-pink-700 to-pink-500",     text: "text-pink-100"  },
  spirits: { bg: "from-purple-900 to-purple-700", text: "text-purple-100"},
};
