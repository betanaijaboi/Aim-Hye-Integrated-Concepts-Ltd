import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/invoice";
import { getCustomerSession } from "@/lib/customerAuth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const orderNo = searchParams.get("orderNo");

  if (!orderId && !orderNo) {
    return NextResponse.json({ error: "orderId or orderNo required" }, { status: 400 });
  }

  // Allow both admin and customer sessions
  const adminSession = await getServerSession(authOptions);
  const customerSession = await getCustomerSession();
  if (!adminSession && !customerSession) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const order = await prisma.customerOrder.findFirst({
    where: orderId ? { id: orderId } : { orderNo: orderNo! },
    include: {
      customer: true,
      items: { include: { product: { include: { brewery: true } } } },
      payment: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Customers can only access their own invoices
  if (customerSession && order.customerId !== customerSession.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdfBuffer = await generateInvoicePDF({
    orderNo: order.orderNo,
    createdAt: order.createdAt,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email,
    },
    deliveryAddress: order.deliveryAddress,
    items: order.items.map((i) => ({
      product: { name: i.product.name, size: i.product.size, brewery: { name: i.product.brewery.name } },
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    totalAmount: order.totalAmount,
    depositAmount: order.depositAmount,
    payment: order.payment,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Invoice-${order.orderNo}.pdf"`,
    },
  });
}
