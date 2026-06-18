import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const order = await prisma.order.update({
    where: { id },
    data,
    include: { customer: true, items: { include: { product: { include: { brewery: true } } } }, assignedTruck: true },
  });
  return NextResponse.json(order);
}
