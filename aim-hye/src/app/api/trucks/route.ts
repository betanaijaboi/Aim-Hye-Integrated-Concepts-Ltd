import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const trucks = await prisma.truck.findMany({
    include: {
      driver: { include: { guarantors: true } },
      salesboy: { include: { guarantors: true } },
      allocations: { orderBy: { date: "desc" }, take: 10, include: { product: { include: { brewery: true } } } },
    },
    orderBy: { plateNumber: "asc" },
  });
  return NextResponse.json(trucks);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const truck = await prisma.truck.create({ data });
  return NextResponse.json(truck, { status: 201 });
}
