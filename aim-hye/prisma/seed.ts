import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Admin user
  const hashedPw = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@aimhye.com" },
    update: {},
    create: {
      email: "admin@aimhye.com",
      name: "Administrator",
      password: hashedPw,
      role: "ADMIN",
    },
  });

  // Breweries
  const champion = await prisma.brewery.upsert({
    where: { name: "Champion Breweries" },
    update: {},
    create: { name: "Champion Breweries", shortName: "CHAMP" },
  });
  const intl = await prisma.brewery.upsert({
    where: { name: "International Breweries" },
    update: {},
    create: { name: "International Breweries", shortName: "INTL" },
  });
  const nb = await prisma.brewery.upsert({
    where: { name: "Nigerian Breweries" },
    update: {},
    create: { name: "Nigerian Breweries", shortName: "NB" },
  });
  const guinness = await prisma.brewery.upsert({
    where: { name: "Guinness Nigeria" },
    update: {},
    create: { name: "Guinness Nigeria", shortName: "GUIN" },
  });

  const products = [
    // Champion Breweries
    { name: "Champion Lager Beer", sku: "CHAMP-LAG-60", breweryId: champion.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2400, pricePerBottle: 200, depositPerCrate: 720 },
    { name: "Champion Lager Beer", sku: "CHAMP-LAG-33", breweryId: champion.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2160, pricePerBottle: 90, depositPerCrate: 480 },
    { name: "Champion Lager (Ginger)", sku: "CHAMP-GING-33", breweryId: champion.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2280, pricePerBottle: 95, depositPerCrate: 480 },
    { name: "Champ Malta", sku: "CHAMP-MALT-33", breweryId: champion.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },

    // International Breweries
    { name: "Trophy Lager", sku: "INTL-TROPH-60", breweryId: intl.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2280, pricePerBottle: 190, depositPerCrate: 720 },
    { name: "Trophy Lager", sku: "INTL-TROPH-33", breweryId: intl.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Trophy Stout", sku: "INTL-TRST-60", breweryId: intl.id, category: "stout", size: "60cl", packSize: 12, pricePerCrate: 2400, pricePerBottle: 200, depositPerCrate: 720 },
    { name: "Hero Lager", sku: "INTL-HERO-60", breweryId: intl.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2280, pricePerBottle: 190, depositPerCrate: 720 },
    { name: "Hero Lager", sku: "INTL-HERO-33", breweryId: intl.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Budweiser", sku: "INTL-BUD-33", breweryId: intl.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 3360, pricePerBottle: 140, depositPerCrate: 480 },
    { name: "Budweiser Royale", sku: "INTL-BUDR-33", breweryId: intl.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 3840, pricePerBottle: 160, depositPerCrate: 480 },
    { name: "Castle Lite", sku: "INTL-CASTL-33", breweryId: intl.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 3120, pricePerBottle: 130, depositPerCrate: 480 },
    { name: "Flying Fish", sku: "INTL-FLYF-33", breweryId: intl.id, category: "rtd", size: "33cl", packSize: 24, pricePerCrate: 3360, pricePerBottle: 140, depositPerCrate: 480 },
    { name: "Eagle Lager", sku: "INTL-EAGLE-60", breweryId: intl.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2040, pricePerBottle: 170, depositPerCrate: 720 },
    { name: "Eagle Stout", sku: "INTL-EAGST-60", breweryId: intl.id, category: "stout", size: "60cl", packSize: 12, pricePerCrate: 2160, pricePerBottle: 180, depositPerCrate: 720 },
    { name: "Grand Malt", sku: "INTL-GRMALT-33", breweryId: intl.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Betamalt", sku: "INTL-BETM-33", breweryId: intl.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 1920, pricePerBottle: 80, depositPerCrate: 480 },

    // Nigerian Breweries
    { name: "Star Lager", sku: "NB-STAR-60", breweryId: nb.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2400, pricePerBottle: 200, depositPerCrate: 720 },
    { name: "Star Lager", sku: "NB-STAR-33", breweryId: nb.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Star Lite", sku: "NB-STARLITE-33", breweryId: nb.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2160, pricePerBottle: 90, depositPerCrate: 480 },
    { name: "Star Radler", sku: "NB-STARRAD-33", breweryId: nb.id, category: "rtd", size: "33cl", packSize: 24, pricePerCrate: 2400, pricePerBottle: 100, depositPerCrate: 480 },
    { name: "Heineken", sku: "NB-HEI-60", breweryId: nb.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 3360, pricePerBottle: 280, depositPerCrate: 720 },
    { name: "Heineken", sku: "NB-HEI-33", breweryId: nb.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 3120, pricePerBottle: 130, depositPerCrate: 480 },
    { name: "Gulder", sku: "NB-GULD-60", breweryId: nb.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2400, pricePerBottle: 200, depositPerCrate: 720 },
    { name: "Gulder", sku: "NB-GULD-33", breweryId: nb.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Goldberg", sku: "NB-GOLDB-60", breweryId: nb.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2160, pricePerBottle: 180, depositPerCrate: 720 },
    { name: "More Lager", sku: "NB-MORE-60", breweryId: nb.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2040, pricePerBottle: 170, depositPerCrate: 720 },
    { name: "Legend Extra Stout", sku: "NB-LEGEND-60", breweryId: nb.id, category: "stout", size: "60cl", packSize: 12, pricePerCrate: 2520, pricePerBottle: 210, depositPerCrate: 720 },
    { name: "Turbo King Dark Ale", sku: "NB-TURBO-60", breweryId: nb.id, category: "stout", size: "60cl", packSize: 12, pricePerCrate: 2400, pricePerBottle: 200, depositPerCrate: 720 },
    { name: "33 Export", sku: "NB-33EXP-33", breweryId: nb.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 1920, pricePerBottle: 80, depositPerCrate: 480 },
    { name: "Desperados", sku: "NB-DESP-33", breweryId: nb.id, category: "rtd", size: "33cl", packSize: 24, pricePerCrate: 3360, pricePerBottle: 140, depositPerCrate: 480 },
    { name: "Tiger Lager", sku: "NB-TIGER-33", breweryId: nb.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2160, pricePerBottle: 90, depositPerCrate: 480 },
    { name: "Maltina", sku: "NB-MALTI-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Amstel Malta", sku: "NB-AMSTM-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Amstel Malta Ultra", sku: "NB-AMSTMU-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2160, pricePerBottle: 90, depositPerCrate: 480 },
    { name: "Fayrouz (Pineapple)", sku: "NB-FAYRP-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Fayrouz (Strawberry)", sku: "NB-FAYRS-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Hi-Malt", sku: "NB-HIMALT-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 1920, pricePerBottle: 80, depositPerCrate: 480 },
    { name: "Malta Gold", sku: "NB-MALTG-33", breweryId: nb.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 1920, pricePerBottle: 80, depositPerCrate: 480 },

    // Guinness Nigeria
    { name: "Guinness Foreign Extra Stout", sku: "GUIN-FES-60", breweryId: guinness.id, category: "stout", size: "60cl", packSize: 12, pricePerCrate: 2760, pricePerBottle: 230, depositPerCrate: 720 },
    { name: "Guinness Extra Smooth", sku: "GUIN-ES-60", breweryId: guinness.id, category: "stout", size: "60cl", packSize: 12, pricePerCrate: 2640, pricePerBottle: 220, depositPerCrate: 720 },
    { name: "Harp Lager", sku: "GUIN-HARP-60", breweryId: guinness.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2280, pricePerBottle: 190, depositPerCrate: 720 },
    { name: "Harp Lager", sku: "GUIN-HARP-33", breweryId: guinness.id, category: "lager", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Satzenbrau", sku: "GUIN-SATZ-60", breweryId: guinness.id, category: "lager", size: "60cl", packSize: 12, pricePerCrate: 2040, pricePerBottle: 170, depositPerCrate: 720 },
    { name: "Dubic Malt", sku: "GUIN-DUBM-33", breweryId: guinness.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 1920, pricePerBottle: 80, depositPerCrate: 480 },
    { name: "Malta Guinness", sku: "GUIN-MALT-33", breweryId: guinness.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2040, pricePerBottle: 85, depositPerCrate: 480 },
    { name: "Malta Guinness Herbs Lite", sku: "GUIN-MALTH-33", breweryId: guinness.id, category: "malt", size: "33cl", packSize: 24, pricePerCrate: 2160, pricePerBottle: 90, depositPerCrate: 480 },
    { name: "Orijin", sku: "GUIN-ORIJ-33", breweryId: guinness.id, category: "rtd", size: "33cl", packSize: 24, pricePerCrate: 3120, pricePerBottle: 130, depositPerCrate: 480 },
    { name: "Orijin Zero", sku: "GUIN-ORIJZ-33", breweryId: guinness.id, category: "rtd", size: "33cl", packSize: 24, pricePerCrate: 2160, pricePerBottle: 90, depositPerCrate: 480 },
    { name: "Smirnoff Ice", sku: "GUIN-SMIRN-33", breweryId: guinness.id, category: "rtd", size: "33cl", packSize: 24, pricePerCrate: 3360, pricePerBottle: 140, depositPerCrate: 480 },
    { name: "Gordon's Dry Gin", sku: "GUIN-GORDN-75", breweryId: guinness.id, category: "spirits", size: "75cl", packSize: 12, pricePerCrate: 18000, pricePerBottle: 1500, depositPerCrate: 0 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, stockCrates: Math.floor(Math.random() * 50) + 10 },
    });
  }

  console.log("✅ Database seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
