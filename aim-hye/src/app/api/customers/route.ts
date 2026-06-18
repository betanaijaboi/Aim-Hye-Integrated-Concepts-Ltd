import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const customers = await prisma.customer.findMany({
    where: q ? {
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
      ],
    } : undefined,
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const customer = await prisma.customer.create({ data });
  return NextResponse.json(customer, { status: 201 });
}
