import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const customer = await prisma.customerAccount.findUnique({
    where: { id: session.id },
    include: {
      webAuthnCreds: { select: { id: true } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orders = await prisma.customerOrder.findMany({
    where: { customerId: session.id },
    include: {
      payment: { select: { status: true, method: true } },
      items: { include: { product: { select: { name: true, sku: true, size: true, packaging: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      hasPin: !!customer.pin,
      hasBiometric: customer.webAuthnCreds.length > 0,
      twoFaEnabled: true,
    },
    orders,
  });
}
