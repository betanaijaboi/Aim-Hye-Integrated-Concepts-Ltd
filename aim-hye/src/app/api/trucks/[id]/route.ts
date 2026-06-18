import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const truck = await prisma.truck.findUnique({
    where: { id },
    include: {
      driver: { include: { guarantors: true } },
      salesboy: { include: { guarantors: true } },
      allocations: { orderBy: { date: "desc" }, include: { product: { include: { brewery: true } } } },
      emptyReturns: { orderBy: { date: "desc" }, include: { product: true } },
    },
  });
  if (!truck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(truck);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const truck = await prisma.truck.update({ where: { id }, data });
  return NextResponse.json(truck);
}
