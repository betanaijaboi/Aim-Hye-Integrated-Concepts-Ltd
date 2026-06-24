import { NextRequest, NextResponse } from "next/server";
import { getManagerSession } from "@/lib/managerAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getManagerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const requests = await prisma.managerChangeRequest.findMany({
    where: { requestedById: session.id },
    include: { product: { select: { name: true, sku: true, size: true, brewery: { select: { shortName: true } } } }, reviewedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getManagerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { type, productId, proposedValue, reason } = await req.json();

  if (!type || !productId || proposedValue === undefined || !reason)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  if (!["STOCK_UPDATE", "PRICE_CHANGE"].includes(type))
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  if (proposedValue < 0)
    return NextResponse.json({ error: "Value must be 0 or greater" }, { status: 400 });

  if (reason.trim().length < 5)
    return NextResponse.json({ error: "Please provide a meaningful reason" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const currentValue = type === "STOCK_UPDATE" ? product.stockCrates : product.pricePerCrate;

  const request = await prisma.managerChangeRequest.create({
    data: {
      requestedById: session.id,
      type,
      productId,
      branch: session.branch,
      currentValue,
      proposedValue,
      reason: reason.trim(),
    },
  });

  return NextResponse.json(request, { status: 201 });
}
