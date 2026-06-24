import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createManagerToken, setManagerCookie, clearManagerCookie } from "@/lib/managerAuth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive || user.role !== "MANAGER")
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await createManagerToken({ id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch ?? "IKOT_EKPENE" });
  await setManagerCookie(token);
  return NextResponse.json({ ok: true, name: user.name });
}

export async function DELETE() {
  await clearManagerCookie();
  return NextResponse.json({ ok: true });
}
