import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const drivers = await prisma.driver.findMany({
    include: { truck: true, guarantors: true },
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const { guarantors, ...driverData } = await req.json();
  const driver = await prisma.driver.create({
    data: {
      ...driverData,
      guarantors: guarantors ? { create: guarantors } : undefined,
    },
    include: { guarantors: true, truck: true },
  });
  return NextResponse.json(driver, { status: 201 });
}
