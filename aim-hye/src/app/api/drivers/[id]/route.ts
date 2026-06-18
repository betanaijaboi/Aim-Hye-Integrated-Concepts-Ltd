import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await prisma.driver.findUnique({ where: { id }, include: { guarantors: true, truck: true } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(driver);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { guarantors, ...data } = await req.json();
  const driver = await prisma.driver.update({
    where: { id },
    data,
    include: { guarantors: true, truck: true },
  });
  return NextResponse.json(driver);
}
