const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE = "https://api.paystack.co";

async function paystackFetch(path: string, method = "GET", body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo
  reference: string;
  channels?: string[];
  metadata?: object;
  authorization_code?: string;
}) {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: Math.round(params.amount * 100), // convert naira to kobo
    reference: params.reference,
    channels: params.channels || ["card", "bank_transfer", "ussd"],
    metadata: params.metadata,
  };
  if (params.authorization_code) body.authorization_code = params.authorization_code;
  return paystackFetch("/transaction/initialize", "POST", body);
}

export async function verifyTransaction(reference: string) {
  return paystackFetch(`/transaction/verify/${reference}`);
}

export async function chargeAuthorization(params: {
  authorization_code: string;
  email: string;
  amount: number; // naira
  reference: string;
  metadata?: object;
}) {
  return paystackFetch("/transaction/charge_authorization", "POST", {
    authorization_code: params.authorization_code,
    email: params.email,
    amount: Math.round(params.amount * 100),
    reference: params.reference,
    metadata: params.metadata,
  });
}

export function generateReference(prefix = "AH"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
