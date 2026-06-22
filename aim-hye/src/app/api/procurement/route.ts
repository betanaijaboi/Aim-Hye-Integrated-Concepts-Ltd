import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generatePONumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${date}-${rand}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const breweryId = searchParams.get("breweryId");

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(breweryId ? { breweryId } : {}),
    },
    include: {
      brewery: true,
      raisedBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
      items: { include: { product: true } },
      payment: { include: { paidBy: { select: { name: true } } } },
      receipts: { include: { items: true, receivedBy: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { breweryId, items, notes, expectedAt } = body;

  if (!breweryId || !items?.length) {
    return NextResponse.json({ error: "Brewery and at least one item required" }, { status: 400 });
  }

  // Look up the admin user record for the session email
  const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user?.email! } });
  if (!adminUser) return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

  // Fetch product prices to compute costs
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = items.map((i: { productId: string; quantityOrdered: number; unitCost: number }) => {
    const product = productMap.get(i.productId);
    if (!product) throw new Error(`Product not found: ${i.productId}`);
    const unitCost = i.unitCost ?? product.pricePerCrate * 0.85; // default: 85% of selling price
    return {
      productId: i.productId,
      quantityOrdered: i.quantityOrdered,
      unitCost,
      totalCost: unitCost * i.quantityOrdered,
    };
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: generatePONumber(),
      breweryId,
      raisedById: adminUser.id,
      status: "PENDING_APPROVAL",
      notes,
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      items: { create: orderItems },
    },
    include: {
      brewery: true,
      items: { include: { product: true } },
      raisedBy: { select: { name: true, role: true } },
    },
  });

  return NextResponse.json(po, { status: 201 });
}
