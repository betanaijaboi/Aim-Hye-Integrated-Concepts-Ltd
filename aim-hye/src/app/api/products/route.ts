import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const breweryId = searchParams.get("breweryId");
  const category = searchParams.get("category");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (breweryId) where.breweryId = breweryId;
  if (category) where.category = category;
  if (active !== null) where.isActive = active === "true";

  const products = await prisma.product.findMany({
    where,
    include: { brewery: true },
    orderBy: [{ brewery: { name: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const product = await prisma.product.create({ data, include: { brewery: true } });
  return NextResponse.json(product, { status: 201 });
}
