import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["SUCCESS", "FAILED", "REFUNDED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status,
      ...(status === "SUCCESS" ? { verifiedAt: new Date() } : {}),
    },
  });

  // If marked as paid, update the order payment status
  if (status === "SUCCESS") {
    await prisma.customerOrder.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });
  }

  return NextResponse.json({ payment });
}
