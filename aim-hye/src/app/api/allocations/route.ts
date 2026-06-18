import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const truckId = searchParams.get("truckId");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (truckId) where.truckId = truckId;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  }

  const allocations = await prisma.truckAllocation.findMany({
    where,
    include: { truck: true, product: { include: { brewery: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(allocations);
}

export async function POST(req: NextRequest) {
  const items: Array<{ truckId: string; productId: string; cratesLoaded: number; pricePerCrate: number; notes?: string }> = await req.json();

  const created = await prisma.$transaction(
    items.map((item) =>
      prisma.truckAllocation.create({
        data: {
          truckId: item.truckId,
          productId: item.productId,
          cratesLoaded: item.cratesLoaded,
          pricePerCrate: item.pricePerCrate,
          totalValue: item.cratesLoaded * item.pricePerCrate,
          notes: item.notes,
        },
        include: { product: { include: { brewery: true } } },
      })
    )
  );

  // Deduct from stock
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (product) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockCrates: Math.max(0, product.stockCrates - item.cratesLoaded) },
      });
      await prisma.stockLog.create({
        data: {
          productId: item.productId,
          prevQty: product.stockCrates,
          newQty: Math.max(0, product.stockCrates - item.cratesLoaded),
          change: -item.cratesLoaded,
          reason: "TRUCK_LOAD",
          reference: item.truckId,
        },
      });
    }
  }

  return NextResponse.json(created, { status: 201 });
}
