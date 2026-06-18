import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();

  const alloc = await prisma.truckAllocation.findUnique({ where: { id } });
  if (!alloc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cratesSold = data.cratesLoaded - (data.cratesReturn ?? alloc.cratesReturn);
  const updated = await prisma.truckAllocation.update({
    where: { id },
    data: {
      ...data,
      cratesSold,
      amountRemitted: cratesSold * alloc.pricePerCrate,
    },
    include: { product: { include: { brewery: true } }, truck: true },
  });

  // Return unsold crates to stock if reconciling
  if (data.status === "RETURNED" && data.cratesReturn) {
    const product = await prisma.product.findUnique({ where: { id: alloc.productId } });
    if (product) {
      await prisma.product.update({
        where: { id: alloc.productId },
        data: { stockCrates: product.stockCrates + data.cratesReturn },
      });
      await prisma.stockLog.create({
        data: {
          productId: alloc.productId,
          prevQty: product.stockCrates,
          newQty: product.stockCrates + data.cratesReturn,
          change: data.cratesReturn,
          reason: "TRUCK_RETURN",
          reference: id,
        },
      });
    }
  }

  return NextResponse.json(updated);
}
