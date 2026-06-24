import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/managerAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getManagerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!user || user.role !== "MANAGER")
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, branch: user.branch });
}
