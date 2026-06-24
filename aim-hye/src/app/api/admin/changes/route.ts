import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const requests = await prisma.managerChangeRequest.findMany({
    include: {
      product: { select: { name: true, sku: true, size: true, brewery: { select: { shortName: true } } } },
      requestedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(requests);
}
