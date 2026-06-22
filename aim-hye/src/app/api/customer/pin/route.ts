import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCustomerSession, createCustomerToken, setCustomerCookie } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

// Set or update PIN (requires OTP verification first)
export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { pin } = await req.json();
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(pin, 12);
  const customer = await prisma.customerAccount.update({
    where: { id: session.id },
    data: { pin: hashed },
  });

  const token = await createCustomerToken({
    id: customer.id, name: customer.name, phone: customer.phone,
    email: customer.email || undefined, pinSet: true,
  });
  await setCustomerCookie(token);

  return NextResponse.json({ success: true });
}

// Verify PIN (used before payment with saved card)
export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { pin } = await req.json();
  const customer = await prisma.customerAccount.findUnique({ where: { id: session.id } });

  if (!customer?.pin) {
    return NextResponse.json({ error: "No PIN set" }, { status: 400 });
  }

  const valid = await bcrypt.compare(pin, customer.pin);
  if (!valid) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });

  return NextResponse.json({ success: true });
}
