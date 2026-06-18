import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Bulk evening stock update
export async function POST(req: NextRequest) {
  const updates: Array<{ productId: string; stockCrates: number; notes?: string }> = await req.json();

  const results = await prisma.$transaction(
    updates.map((u) =>
      prisma.product.update({
        where: { id: u.productId },
        data: { stockCrates: u.stockCrates, updatedAt: new Date() },
      })
    )
  );

  // Log each change
  for (const u of updates) {
    const current = results.find((r) => r.id === u.productId);
    if (current) {
      await prisma.stockLog.create({
        data: {
          productId: u.productId,
          prevQty: current.stockCrates,
          newQty: u.stockCrates,
          change: u.stockCrates - current.stockCrates,
          reason: "EVENING_UPDATE",
          notes: u.notes,
        },
      });
    }
  }

  return NextResponse.json({ updated: results.length });
}

export async function GET() {
  const logs = await prisma.stockLog.findMany({
    include: { product: { include: { brewery: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}
