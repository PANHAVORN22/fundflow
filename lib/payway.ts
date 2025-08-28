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

// --- ABA/PayWay HMAC helper ---
// Concatenate values in the exact order specified by the gateway and
// return Base64(HMAC-SHA512(concatenated, public_key))
export type AbaConcatenationFields = {
  req_time?: string;
  merchant_id?: string;
  tran_id?: string;
  amount?: string | number;
  items?: string;
  shipping?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  type?: string;
  payment_option?: string;
  return_url?: string;
  cancel_url?: string;
  continue_success_url?: string;
  return_deeplink?: string;
  currency?: string;
  custom_fields?: string;
  return_params?: string;
  payout?: string;
  lifetime?: string | number;
  additional_params?: string;
  google_pay_token?: string;
  skip_success_page?: string | number | boolean;
};

const ABA_ORDER: (keyof AbaConcatenationFields)[] = [
  "req_time",
  "merchant_id",
  "tran_id",
  "amount",
  "items",
  "shipping",
  "firstname",
  "lastname",
  "email",
  "phone",
  "type",
  "payment_option",
  "return_url",
  "cancel_url",
  "continue_success_url",
  "return_deeplink",
  "currency",
  "custom_fields",
  "return_params",
  "payout",
  "lifetime",
  "additional_params",
  "google_pay_token",
  "skip_success_page",
];

export function generateAbaHmacSignature(
  fields: Partial<AbaConcatenationFields>,
  publicKey: string
) {
  // Concatenate with empty string for any missing field, no separators
  let concatenated = "";
  for (const key of ABA_ORDER) {
    const raw = fields[key];
    concatenated += raw === undefined || raw === null ? "" : String(raw);
  }

  // HMAC-SHA512 with provided publicKey, output Base64
  const hmac = crypto
    .createHmac("sha512", publicKey || "")
    .update(concatenated, "utf8")
    .digest("base64");

  return {
    concatenated,
    signatureBase64: hmac,
  };
}
