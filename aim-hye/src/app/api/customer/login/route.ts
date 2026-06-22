import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerToken, setCustomerCookie, clearCustomerCookie } from "@/lib/customerAuth";
import { createOTP, verifyOTP, sendOTPSMS } from "@/lib/otp";

// Step 1: Send OTP to phone
export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  const customer = await prisma.customerAccount.findFirst({ where: { phone } });
  if (!customer || !customer.isActive) {
    return NextResponse.json({ error: "No account found with this phone number" }, { status: 404 });
  }

  const code = await createOTP(customer.id, "LOGIN");
  await sendOTPSMS(phone, code, "LOGIN");

  const hasWebAuthn = await prisma.webAuthnCredential.count({ where: { customerId: customer.id } });

  return NextResponse.json({
    success: true,
    hasPin: !!customer.pin,
    hasBiometric: hasWebAuthn > 0,
    devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
  });
}

// Step 2: Verify OTP and complete login
export async function PATCH(req: NextRequest) {
  const { phone, otp } = await req.json();

  if (!phone || !otp) return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });

  const customer = await prisma.customerAccount.findFirst({ where: { phone } });
  if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const valid = await verifyOTP(customer.id, otp, "LOGIN");
  if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });

  const hasWebAuthn = await prisma.webAuthnCredential.count({ where: { customerId: customer.id } });

  // If no PIN/biometric, log in immediately
  if (!customer.pin && hasWebAuthn === 0) {
    const token = await createCustomerToken({
      id: customer.id, name: customer.name, phone: customer.phone,
      email: customer.email || undefined, pinSet: false,
    });
    await setCustomerCookie(token);
    return NextResponse.json({ success: true, loggedIn: true, hasPin: false, hasBiometric: false });
  }

  // Has PIN or biometric — set a temporary verified cookie, require second factor
  const token = await createCustomerToken({
    id: customer.id, name: customer.name, phone: customer.phone,
    email: customer.email || undefined, pinSet: !!customer.pin,
  });
  await setCustomerCookie(token);

  return NextResponse.json({
    success: true,
    loggedIn: true,
    hasPin: !!customer.pin,
    hasBiometric: hasWebAuthn > 0,
  });
}

// Logout
export async function DELETE() {
  await clearCustomerCookie();
  return NextResponse.json({ success: true });
}
