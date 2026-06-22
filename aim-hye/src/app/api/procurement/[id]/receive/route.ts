import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

function generateGRNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GR-${date}-${rand}`;
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { items, notes } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "At least one item required" }, { status: 400 });
  }

  const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user?.email! } });
  if (!adminUser) return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, receipts: { include: { items: true } } },
  });

  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

  if (!["PAID", "PARTIALLY_RECEIVED"].includes(po.status)) {
    return NextResponse.json({ error: "PO must be paid before recording a delivery" }, { status: 400 });
  }

  // Build receipt items and compute shortfalls
  const receiptItems = items.map((i: { productId: string; quantityReceived: number }) => {
    const poItem = po.items.find((p) => p.productId === i.productId);
    if (!poItem) throw new Error(`Product ${i.productId} not in this PO`);

    // How much already received in previous GRs
    const alreadyReceived = po.receipts
      .flatMap((r) => r.items)
      .filter((ri) => ri.productId === i.productId)
      .reduce((s, ri) => s + ri.quantityReceived, 0);

    const remaining = poItem.quantityOrdered - alreadyReceived;
    const received = Math.min(i.quantityReceived, remaining); // can't receive more than ordered
    const shortfall = remaining - received;

    return {
      productId: i.productId,
      quantityOrdered: poItem.quantityOrdered,
      quantityReceived: received,
      quantityShortfall: shortfall,
    };
  });

  // Create the goods receipt
  const gr = await prisma.goodsReceipt.create({
    data: {
      receiptNumber: generateGRNumber(),
      purchaseOrderId: id,
      receivedById: adminUser.id,
      notes,
      isPartial: receiptItems.some((i: { quantityShortfall: number }) => i.quantityShortfall > 0),
      items: { create: receiptItems },
    },
    include: { items: { include: { product: true } } },
  });

  // Add received quantities to warehouse stock and log each movement
  for (const item of receiptItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;

    const newStock = product.stockCrates + item.quantityReceived;

    await prisma.product.update({
      where: { id: item.productId },
      data: { stockCrates: newStock },
    });

    await prisma.stockLog.create({
      data: {
        productId: item.productId,
        change: item.quantityReceived,
        prevQty: product.stockCrates,
        newQty: newStock,
        reason: "PURCHASE",
        reference: gr.receiptNumber,
        notes: `Delivery from PO ${po.poNumber} (GR: ${gr.receiptNumber})`,
      },
    });
  }

  // Determine new PO status
  const allReceipts = await prisma.goodsReceipt.findMany({
    where: { purchaseOrderId: id },
    include: { items: true },
  });

  const totalReceivedByProduct = new Map<string, number>();
  for (const r of allReceipts) {
    for (const ri of r.items) {
      totalReceivedByProduct.set(ri.productId, (totalReceivedByProduct.get(ri.productId) || 0) + ri.quantityReceived);
    }
  }

  const fullyReceived = po.items.every(
    (poItem) => (totalReceivedByProduct.get(poItem.productId) || 0) >= poItem.quantityOrdered
  );

  const newStatus = fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";
  await prisma.purchaseOrder.update({ where: { id }, data: { status: newStatus } });

  return NextResponse.json({ goodsReceipt: gr, newPOStatus: newStatus }, { status: 201 });
}
