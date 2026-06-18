import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const salesboys = await prisma.salesboy.findMany({
    include: { truck: true, guarantors: true },
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json(salesboys);
}

export async function POST(req: NextRequest) {
  const { guarantors, ...data } = await req.json();
  const salesboy = await prisma.salesboy.create({
    data: { ...data, guarantors: guarantors ? { create: guarantors } : undefined },
    include: { guarantors: true, truck: true },
  });
  return NextResponse.json(salesboy, { status: 201 });
}
