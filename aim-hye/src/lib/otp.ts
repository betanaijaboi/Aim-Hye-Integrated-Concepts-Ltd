import { prisma } from "./prisma";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOTP(customerId: string, purpose: string): Promise<string> {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate old OTPs for same purpose
  await prisma.oTP.updateMany({
    where: { customerId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.oTP.create({ data: { customerId, code, purpose, expiresAt } });
  return code;
}

export async function verifyOTP(customerId: string, code: string, purpose: string): Promise<boolean> {
  const otp = await prisma.oTP.findFirst({
    where: { customerId, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  // Track attempts
  if (otp.attempts >= 5) {
    await prisma.oTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    return false;
  }

  if (otp.code !== code) {
    await prisma.oTP.update({ where: { id: otp.id }, data: { attempts: otp.attempts + 1 } });
    return false;
  }

  await prisma.oTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return true;
}

export async function sendOTPEmail(email: string, code: string, purpose: string): Promise<void> {
  // In production, integrate with nodemailer/Termii SMS
  // For now, log it (in dev you see it in console)
  console.log(`[OTP] To: ${email} | Purpose: ${purpose} | Code: ${code}`);

  // TODO: Replace with real email/SMS sending
  // const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, ... });
  // await transporter.sendMail({ to: email, subject: `Your OTP: ${code}`, text: `Code: ${code} (expires in 10 mins)` });
}

export async function sendOTPSMS(phone: string, code: string, purpose: string): Promise<void> {
  // TODO: Integrate Termii or Infobip for Nigerian SMS
  console.log(`[OTP SMS] To: ${phone} | Purpose: ${purpose} | Code: ${code}`);
}
