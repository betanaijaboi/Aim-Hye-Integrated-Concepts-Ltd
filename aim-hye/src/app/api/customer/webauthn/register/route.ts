import { NextRequest, NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { getCustomerSession } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const RP_NAME = process.env.NEXT_PUBLIC_RP_NAME || "Aim-Hye Integrated Concepts";
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

// In-memory challenge store (use Redis in production)
const challenges = new Map<string, string>();

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const existingCreds = await prisma.webAuthnCredential.findMany({
    where: { customerId: session.id },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(session.id),
    userName: session.phone,
    userDisplayName: session.name,
    excludeCredentials: existingCreds.map((c) => ({
      id: c.credentialId,
      transports: ["internal"] as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
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

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credential, aaguid, credentialDeviceType } = verification.registrationInfo;

    await prisma.webAuthnCredential.create({
      data: {
        customerId: session.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64"),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        aaguid,
      },
    });

    challenges.delete(session.id);
    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
