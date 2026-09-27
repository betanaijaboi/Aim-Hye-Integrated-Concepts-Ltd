import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// The dev fallback is public (this repo is open source), so production must
// set NEXTAUTH_SECRET. Resolved lazily so `next build` doesn't need it.
const AUDIENCE = "manager";
function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET must be set in production");
  }
  return new TextEncoder().encode(secret || "aim-hye-manager-secret");
}

export interface ManagerSession {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
}

export async function createManagerToken(user: ManagerSession): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function getManagerSession(): Promise<ManagerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("manager_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret(), { audience: AUDIENCE });
    return payload as unknown as ManagerSession;
  } catch {
    return null;
  }
}

export async function setManagerCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("manager_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });
}

export async function clearManagerCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("manager_token");
}
