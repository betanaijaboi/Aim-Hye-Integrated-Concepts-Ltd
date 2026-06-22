import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { createOTP, verifyOTP, sendOTPSMS } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

// Send OTP
export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { purpose } = await req.json();
  const customer = await prisma.customerAccount.findUnique({ where: { id: session.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const code = await createOTP(customer.id, purpose);
  await sendOTPSMS(customer.phone, code, purpose);

  return NextResponse.json({
    success: true,
    devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
  });
}

// Verify OTP
export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { otp, purpose } = await req.json();
  const valid = await verifyOTP(session.id, otp, purpose);

  if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  return NextResponse.json({ success: true });
}
