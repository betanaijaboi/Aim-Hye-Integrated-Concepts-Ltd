import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brewery: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch siblings (same productFamily + brewery) for the variant picker
  let siblings: typeof product[] = [];
  if (product.productFamily) {
    siblings = await prisma.product.findMany({
      where: {
        productFamily: product.productFamily,
        breweryId: product.breweryId,
        isActive: true,
        id: { not: product.id },
      },
      include: { brewery: true },
      orderBy: [{ size: "asc" }, { packaging: "asc" }],
    });
  }

  return NextResponse.json({ ...product, siblings });
}
