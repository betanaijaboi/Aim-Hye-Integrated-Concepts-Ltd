import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { decision, reviewNote } = await req.json(); // decision: "APPROVED" | "REJECTED"

  if (!["APPROVED", "REJECTED"].includes(decision))
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  const changeRequest = await prisma.managerChangeRequest.findUnique({
    where: { id },
    include: { product: true },
  });

  if (!changeRequest)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (changeRequest.status !== "PENDING")
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

  const adminUser = await prisma.adminUser.findUnique({
    where: { email: session.user?.email ?? "" },
  });
  if (!adminUser)
    return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

  // Apply the change if approved
  if (decision === "APPROVED") {
    if (changeRequest.type === "STOCK_UPDATE") {
      await prisma.product.update({
        where: { id: changeRequest.productId },
        data: { stockCrates: Math.round(changeRequest.proposedValue) },
      });
      await prisma.stockLog.create({
        data: {
          productId: changeRequest.productId,
          prevQty: Math.round(changeRequest.currentValue),
          newQty: Math.round(changeRequest.proposedValue),
          change: Math.round(changeRequest.proposedValue) - Math.round(changeRequest.currentValue),
          reason: "MANAGER_UPDATE",
          reference: changeRequest.id,
          notes: changeRequest.reason,
        },
      });
    } else if (changeRequest.type === "PRICE_CHANGE") {
      const product = changeRequest.product;
      const ratio = changeRequest.proposedValue / product.pricePerCrate;
      await prisma.product.update({
        where: { id: changeRequest.productId },
        data: {
          pricePerCrate: changeRequest.proposedValue,
          pricePerBottle: parseFloat((product.pricePerBottle * ratio).toFixed(2)),
        },
      });
    }
  }

  const updated = await prisma.managerChangeRequest.update({
    where: { id },
    data: {
      status: decision,
      reviewedById: adminUser.id,
      reviewNote: reviewNote?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
