import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";
import { generateOrderNo } from "@/lib/utils";
import { generateReference } from "@/lib/paystack";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orders = await prisma.customerOrder.findMany({
    where: { customerId: session.id },
    include: {
      items: { include: { product: { include: { brewery: true } } } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { deliveryAddress, notes, paymentMethod, items: inlineItems } = body;

  if (!deliveryAddress) {
    return NextResponse.json({ error: "Delivery address required" }, { status: 400 });
  }

  let orderItems: Array<{ productId: string; quantity: number; unitPrice: number; subtotal: number }>;

  if (inlineItems && Array.isArray(inlineItems) && inlineItems.length > 0) {
    // Inline items from storefront cart
    const productIds = inlineItems.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of inlineItems) {
      const product = productMap.get(item.productId);
      if (!product) return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      const cratesNeeded = item.unit === "bottle"
        ? Math.ceil(item.quantity / product.packSize)
        : item.quantity;
      if (product.stockCrates < cratesNeeded) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }
    }

    orderItems = inlineItems.map((i: { productId: string; quantity: number; unit?: "bottle" | "crate" }) => {
      const p = productMap.get(i.productId)!;
      const unit = i.unit ?? "crate";
      const unitPrice = unit === "bottle" ? p.pricePerBottle : p.pricePerCrate;
      return { productId: i.productId, quantity: i.quantity, unitPrice, subtotal: unitPrice * i.quantity };
    });

    const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const depositAmount = inlineItems.reduce((s: number, i: { productId: string; quantity: number; unit?: "bottle" | "crate" }) => {
      if ((i.unit ?? "crate") === "bottle") return s; // no deposit for individual bottles
      return s + (productMap.get(i.productId)?.depositPerCrate ?? 0) * i.quantity;
    }, 0);

    const paystackRef = paymentMethod?.startsWith("PAYSTACK") ? generateReference("AH") : undefined;
    const totalPayable = totalAmount + depositAmount;

    const order = await prisma.customerOrder.create({
      data: {
        orderNo: generateOrderNo(),
        customerId: session.id,
        totalAmount,
        depositAmount,
        deliveryAddress,
        notes,
        items: { create: orderItems },
        ...(paystackRef ? {
          payment: {
            create: {
              customerId: session.id,
              method: paymentMethod,
              amount: totalPayable,
              reference: paystackRef,
              paystackRef,
              status: "PENDING",
            },
          },
        } : paymentMethod === "BANK_TRANSFER" ? {
          payment: {
            create: {
              customerId: session.id,
              method: "BANK_TRANSFER",
              amount: totalPayable,
              reference: generateReference("BT"),
              status: "PENDING",
            },
          },
        } : {}),
      },
    });

    // Deduct stock (convert bottle orders to crate-equivalent, ceiling)
    for (const item of inlineItems) {
      const product = productMap.get(item.productId)!;
      const unit = item.unit ?? "crate";
      const cratesDeducted = unit === "bottle"
        ? Math.ceil(item.quantity / product.packSize)
        : item.quantity;
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockCrates: { decrement: cratesDeducted } },
      });
    }

    return NextResponse.json({ orderId: order.id, orderNo: order.orderNo, totalPayable, paystackRef }, { status: 201 });
  }

  // DB cart flow (legacy)
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId: session.id },
    include: { product: true },
  });
  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  orderItems = cartItems.map((ci) => ({
    productId: ci.productId,
    quantity: ci.quantity,
    unitPrice: ci.product.pricePerCrate,
    subtotal: ci.product.pricePerCrate * ci.quantity,
  }));

  const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const depositAmount = cartItems.reduce((s, ci) => s + ci.product.depositPerCrate * ci.quantity, 0);
  const totalPayable = totalAmount + depositAmount;
  const paystackRef = paymentMethod?.startsWith("PAYSTACK") ? generateReference("AH") : undefined;

  const order = await prisma.customerOrder.create({
    data: {
      orderNo: generateOrderNo(),
      customerId: session.id,
      totalAmount,
      depositAmount,
      deliveryAddress,
      notes,
      items: { create: orderItems },
    },
  });

  await prisma.cartItem.deleteMany({ where: { customerId: session.id } });

  return NextResponse.json({ orderId: order.id, orderNo: order.orderNo, totalPayable, paystackRef }, { status: 201 });
}
