import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const method = searchParams.get("method");

  const payments = await prisma.payment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
    },
    include: {
      order: {
        include: {
          customer: { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ payments });
}
