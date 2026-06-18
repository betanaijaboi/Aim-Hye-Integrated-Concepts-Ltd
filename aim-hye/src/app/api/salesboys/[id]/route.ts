import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { guarantors, ...data } = await req.json();
  void guarantors;
  const salesboy = await prisma.salesboy.update({ where: { id }, data, include: { guarantors: true, truck: true } });
  return NextResponse.json(salesboy);
}
