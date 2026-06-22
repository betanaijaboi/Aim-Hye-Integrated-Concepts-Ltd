import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { orderId, method, savedCardAuth } = await req.json();

  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: { customer: true, payment: true },
  });

  if (!order || order.customerId !== session.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment) {
    return NextResponse.json({ error: "Payment already exists for this order" }, { status: 400 });
  }

  const reference = generateReference();
  const totalAmount = order.totalAmount + order.depositAmount;
  const email = order.customer.email || `${session.phone}@aimhye.com`;

  let result;

  if (method === "BANK_TRANSFER") {
    // Manual bank transfer - create payment record, admin will verify
    const payment = await prisma.payment.create({
      data: {
        customerId: session.id,
        orderId,
        method: "BANK_TRANSFER",
        amount: totalAmount,
        reference,
        status: "PENDING",
      },
    });
    return NextResponse.json({
      success: true,
      method: "BANK_TRANSFER",
      reference: payment.reference,
      bankDetails: {
        bankName: "First Bank of Nigeria",
        accountName: "Aim-Hye Integrated Concepts Limited",
        accountNumber: "3012345678",
        amount: totalAmount,
        narration: `Payment for ${order.orderNo}`,
      },
    });
  }

  if (method === "PAYSTACK_CARD" && savedCardAuth) {
    // Charge saved card directly (PIN already verified by caller)
    const { chargeAuthorization } = await import("@/lib/paystack");
    result = await chargeAuthorization({
      authorization_code: savedCardAuth,
      email,
      amount: totalAmount,
      reference,
      metadata: { orderId, orderNo: order.orderNo },
    });

    if (result.data?.status === "success") {
      await prisma.payment.create({
        data: {
          customerId: session.id,
          orderId,
          method: "PAYSTACK_CARD",
          amount: totalAmount,
          reference,
          paystackRef: result.data.reference,
          status: "SUCCESS",
          verifiedAt: new Date(),
        },
      });
      await prisma.customerOrder.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
      return NextResponse.json({ success: true, status: "success", reference });
    }
    return NextResponse.json({ error: "Card charge failed", detail: result.data?.gateway_response }, { status: 400 });
  }

  // Standard Paystack popup (card or bank_transfer via Paystack)
  const channels = method === "PAYSTACK_TRANSFER" ? ["bank_transfer"] : ["card", "bank_transfer", "ussd"];
  result = await initializeTransaction({
    email,
    amount: totalAmount,
    reference,
    channels,
    metadata: { orderId, orderNo: order.orderNo, customerId: session.id },
  });

  if (!result.data?.authorization_url) {
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }

  await prisma.payment.create({
    data: {
      customerId: session.id,
      orderId,
      method: method === "PAYSTACK_TRANSFER" ? "PAYSTACK_TRANSFER" : "PAYSTACK_CARD",
      amount: totalAmount,
      reference,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    success: true,
    authorizationUrl: result.data.authorization_url,
    reference,
    accessCode: result.data.access_code,
  });
}
