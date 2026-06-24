import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "aim-hye-manager-secret"
);

export interface ManagerSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function createManagerToken(user: ManagerSession): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function getManagerSession(): Promise<ManagerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("manager_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
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
