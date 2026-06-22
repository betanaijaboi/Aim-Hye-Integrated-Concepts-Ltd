import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      brewery: true,
      raisedBy: { select: { id: true, name: true, role: true } },
      approvedBy: { select: { id: true, name: true } },
      items: { include: { product: { include: { brewery: true } } } },
      payment: { include: { paidBy: { select: { name: true } } } },
      receipts: {
        include: {
          items: { include: { product: true } },
          receivedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

// PATCH handles: approve, record-payment, cancel
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const adminUser = await prisma.adminUser.findUnique({ where: { email: session.user?.email! } });
  if (!adminUser) return NextResponse.json({ error: "Admin user not found" }, { status: 404 });

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payment: true },
  });
  if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

  // ── APPROVE ────────────────────────────────────────────────────────────────
  if (action === "approve") {
    if (adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can approve purchase orders" }, { status: 403 });
    }
    if (po.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "PO is not pending approval" }, { status: 400 });
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "APPROVED", approvedById: adminUser.id },
    });
    return NextResponse.json(updated);
  }

  // ── RECORD PAYMENT ─────────────────────────────────────────────────────────
  if (action === "pay") {
    if (adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can record payments" }, { status: 403 });
    }
    if (!["APPROVED"].includes(po.status)) {
      return NextResponse.json({ error: "PO must be approved before payment" }, { status: 400 });
    }
    if (po.payment) {
      return NextResponse.json({ error: "Payment already recorded" }, { status: 400 });
    }

    const { amountPaid, bankName, accountName, transferRef, paidAt, notes: payNotes } = body;
    if (!amountPaid || !paidAt) {
      return NextResponse.json({ error: "amountPaid and paidAt are required" }, { status: 400 });
    }

    await prisma.purchasePayment.create({
      data: {
        purchaseOrderId: id,
        amountPaid: Number(amountPaid),
        bankName,
        accountName,
        transferRef,
        paidAt: new Date(paidAt),
        paidById: adminUser.id,
        notes: payNotes,
      },
    });

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "PAID" },
    });
    return NextResponse.json(updated);
  }

  // ── CANCEL ────────────────────────────────────────────────────────────────
  if (action === "cancel") {
    if (!["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(po.status)) {
      return NextResponse.json({ error: "Cannot cancel a PO that has been paid or received" }, { status: 400 });
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  }

  // ── CLOSE (manual close after partial delivery) ────────────────────────────
  if (action === "close") {
    if (!["PARTIALLY_RECEIVED", "RECEIVED"].includes(po.status)) {
      return NextResponse.json({ error: "Can only close received or partially-received POs" }, { status: 400 });
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CLOSED" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
