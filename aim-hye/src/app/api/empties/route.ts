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

  const empties = await prisma.emptyReturn.findMany({
    where,
    include: { truck: true, product: { include: { brewery: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(empties);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  const totalBottles = data.cratesReturned * (product?.packSize || 12) + (data.looseBottles || 0);
  const depositValue = data.cratesReturned * (product?.depositPerCrate || 0);

  const record = await prisma.emptyReturn.create({
    data: { ...data, totalBottles, depositValue },
    include: { truck: true, product: { include: { brewery: true } } },
  });
  return NextResponse.json(record, { status: 201 });
}
