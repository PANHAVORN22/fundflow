import crypto from "crypto";

type BuildPaywayUrlsArgs = {
  baseUrl: string;
  campaignId: string;
  userId: string;
  amount: number;
  comment?: string;
  method: "aba" | "card";
};

const SIGN_KEYS = ["user", "campaign", "amount", "method", "comment"] as const;

function canonicalize(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const key of SIGN_KEYS) {
    const value = params[key];
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  }
  return qs.toString();
}

export function buildCallbackUrl({
  baseUrl,
  campaignId,
  userId,
  amount,
  comment,
  method,
}: BuildPaywayUrlsArgs) {
  const unsigned = canonicalize({
    user: userId,
    campaign: campaignId,
    amount: String(amount),
    method,
    comment,
  });
  const signature = signPayload(unsigned);
  const full = new URLSearchParams(unsigned);
  full.set("sig", signature);
  return `${baseUrl}/api/payway/callback?${full.toString()}`;
}

export function signPayload(payload: string) {
  const secret = process.env.PAYWAY_API_KEY || "";
  console.log("Signing payload:", payload);
  console.log("Using secret length:", secret.length);
  const signature = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  console.log("Generated signature:", signature);
  return signature;
}

export function verifySignature(query: URLSearchParams) {
  const sig = query.get("sig");
  if (!sig) return false;
  const unsigned = canonicalize({
    user: query.get("user") || undefined,
    campaign: query.get("campaign") || undefined,
    amount: query.get("amount") || undefined,
    method: query.get("method") || undefined,
    comment: query.get("comment") || undefined,
  });
  console.log("Verifying unsigned payload:", unsigned);
  console.log("Received signature:", sig);
  const expected = signPayload(unsigned);
  console.log("Expected signature:", expected);
  try {
    const result = crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expected)
    );
    console.log("Signature verification result:", result);
    return result;
  } catch {
    return false;
  }
}
