import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { getCustomerSession } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

const challenges = new Map<string, string>();

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const creds = await prisma.webAuthnCredential.findMany({ where: { customerId: session.id } });
  if (!creds.length) return NextResponse.json({ error: "No biometric registered" }, { status: 404 });

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: creds.map((c) => ({
      id: c.credentialId,
      transports: ["internal"] as AuthenticatorTransportFuture[],
    })),
    userVerification: "preferred",
  });

  challenges.set(session.id, options.challenge);
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const challenge = challenges.get(session.id);
  if (!challenge) return NextResponse.json({ error: "No challenge found" }, { status: 400 });

  const cred = await prisma.webAuthnCredential.findUnique({ where: { credentialId: body.id } });
  if (!cred || cred.customerId !== session.id) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cred.credentialId,
        publicKey: Buffer.from(cred.publicKey, "base64"),
        counter: cred.counter,
      },
    });

    if (!verification.verified) return NextResponse.json({ error: "Verification failed" }, { status: 400 });

    await prisma.webAuthnCredential.update({
      where: { id: cred.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    challenges.delete(session.id);
    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
