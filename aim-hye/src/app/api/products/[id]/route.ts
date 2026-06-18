import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { brewery: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();

  // Log stock change if stockCrates changed
  if (data.stockCrates !== undefined) {
    const current = await prisma.product.findUnique({ where: { id } });
    if (current && current.stockCrates !== data.stockCrates) {
      await prisma.stockLog.create({
        data: {
          productId: id,
          prevQty: current.stockCrates,
          newQty: data.stockCrates,
          change: data.stockCrates - current.stockCrates,
          reason: data.reason || "ADJUSTMENT",
          notes: data.notes,
        },
      });
    }
  }

  const { reason, notes, ...updateData } = data;
  void reason; void notes;
  const product = await prisma.product.update({ where: { id }, data: updateData, include: { brewery: true } });
  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
