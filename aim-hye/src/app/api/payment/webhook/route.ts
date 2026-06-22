import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  // Verify webhook signature
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const ref = event.data.reference;
    const payment = await prisma.payment.findUnique({ where: { reference: ref } });

    if (payment && payment.status === "PENDING") {
      await prisma.payment.update({
        where: { reference: ref },
        data: { status: "SUCCESS", paystackRef: ref, verifiedAt: new Date() },
      });
      await prisma.customerOrder.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });

      // Save card if reusable
      const auth = event.data.authorization;
      if (auth?.reusable && auth.authorization_code) {
        const existing = await prisma.savedCard.findFirst({
          where: { customerId: payment.customerId, last4: auth.last4, brand: auth.brand },
        });
        if (!existing) {
          await prisma.savedCard.create({
            data: {
              customerId: payment.customerId,
              paystackAuth: auth.authorization_code,
              last4: auth.last4,
              brand: auth.card_type || "Card",
              expMonth: auth.exp_month,
              expYear: auth.exp_year,
              email: event.data.customer?.email || "",
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
