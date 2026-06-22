import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "aim-hye-customer-secret"
);

export interface CustomerSession {
  id: string;
  name: string;
  phone: string;
  email?: string;
  pinSet: boolean;
}

export async function createCustomerToken(customer: CustomerSession): Promise<string> {
  return new SignJWT({ ...customer })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as CustomerSession;
  } catch {
    return null;
  }
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function setCustomerCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("customer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });
}

export async function clearCustomerCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("customer_token");
}

export async function getCustomerFromDb(id: string) {
  return prisma.customerAccount.findUnique({
    where: { id },
    include: { addresses: true, savedCards: true },
  });
}
