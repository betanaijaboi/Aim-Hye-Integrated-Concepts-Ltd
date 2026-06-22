import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: true,
      items: { include: { product: { include: { brewery: true } } } },
      assignedTruck: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { customer: customerData, items, deliveryAddress, notes } = await req.json();

  // Upsert customer by phone
  const customer = await prisma.customer.upsert({
    where: { id: customerData.id || "new" },
    update: customerData,
    create: { ...customerData, id: undefined },
  }).catch(async () => {
    return await prisma.customer.create({ data: customerData });
  });

  // Calculate totals
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
  });

  const orderItems = items.map((item: { productId: string; quantity: number; unit?: "bottle" | "crate" }) => {
    const product = products.find((p) => p.id === item.productId)!;
    const unit = item.unit ?? "crate";
    const unitPrice = unit === "bottle" ? product.pricePerBottle : product.pricePerCrate;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
    };
  });

  const totalAmount = orderItems.reduce((s: number, i: { subtotal: number }) => s + i.subtotal, 0);
  const depositAmount = items.reduce((s: number, item: { productId: string; quantity: number; unit?: "bottle" | "crate" }) => {
    if ((item.unit ?? "crate") === "bottle") return s;
    const p = products.find((p) => p.id === item.productId)!;
    return s + p.depositPerCrate * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      orderNo: generateOrderNo(),
      customerId: customer.id,
      totalAmount,
      depositAmount,
      deliveryAddress,
      notes,
      items: { create: orderItems },
    },
    include: {
      customer: true,
      items: { include: { product: { include: { brewery: true } } } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
