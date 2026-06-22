import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ items: [] });

  const items = await prisma.cartItem.findMany({
    where: { customerId: session.id },
    include: { product: { include: { brewery: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { productId, quantity } = await req.json();

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { customerId: session.id, productId } });
    return NextResponse.json({ success: true });
  }

  const item = await prisma.cartItem.upsert({
    where: { customerId_productId: { customerId: session.id, productId } },
    update: { quantity },
    create: { customerId: session.id, productId, quantity },
    include: { product: { include: { brewery: true } } },
  });
  return NextResponse.json(item);
}

export async function DELETE() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.cartItem.deleteMany({ where: { customerId: session.id } });
  return NextResponse.json({ success: true });
}
