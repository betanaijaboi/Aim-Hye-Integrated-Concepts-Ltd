import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerToken, setCustomerCookie } from "@/lib/customerAuth";
import { createOTP, verifyOTP, sendOTPSMS } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const { name, phone, email } = await req.json();

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const existing = await prisma.customerAccount.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    return NextResponse.json({ error: "Account with this phone/email already exists" }, { status: 409 });
  }

  // Create account (unverified)
  const customer = await prisma.customerAccount.create({
    data: { name, phone, email: email || null },
  });

  const code = await createOTP(customer.id, "REGISTER");
  await sendOTPSMS(phone, code, "REGISTER");

  return NextResponse.json({
    success: true,
    message: "OTP sent to your phone",
    devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
  }, { status: 201 });
}

// Verify OTP after registration — logs the customer in
export async function PATCH(req: NextRequest) {
  const { phone, otp } = await req.json();

  if (!phone || !otp) {
    return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
  }

  const customer = await prisma.customerAccount.findFirst({ where: { phone } });
  if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const valid = await verifyOTP(customer.id, otp, "REGISTER");
  if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });

  const token = await createCustomerToken({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || undefined,
    pinSet: false,
  });
  await setCustomerCookie(token);

  return NextResponse.json({ success: true, customer: { id: customer.id, name: customer.name } });
}
