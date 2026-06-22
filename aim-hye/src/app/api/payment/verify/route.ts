import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { reference } = await req.json();

  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment || payment.customerId !== session.id) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const result = await verifyTransaction(reference);
  const tx = result.data;

  if (tx?.status === "success") {
    await prisma.payment.update({
      where: { reference },
      data: { status: "SUCCESS", paystackRef: tx.reference, verifiedAt: new Date() },
    });

    await prisma.customerOrder.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });

    // Save card authorization for future use
    if (tx.authorization?.reusable && tx.authorization.authorization_code) {
      const existing = await prisma.savedCard.findFirst({
        where: { customerId: session.id, last4: tx.authorization.last4, brand: tx.authorization.brand },
      });
      if (!existing) {
        await prisma.savedCard.create({
          data: {
            customerId: session.id,
            paystackAuth: tx.authorization.authorization_code,
            last4: tx.authorization.last4,
            brand: tx.authorization.card_type || "Card",
            expMonth: tx.authorization.exp_month,
            expYear: tx.authorization.exp_year,
            email: tx.customer?.email || "",
          },
        });
      }
    }

    return NextResponse.json({ success: true, status: "success" });
  }

  return NextResponse.json({ success: false, status: tx?.status || "failed" });
}
