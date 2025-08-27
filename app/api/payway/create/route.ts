import { NextRequest, NextResponse } from "next/server";
import { buildCallbackUrl } from "@/lib/payway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, userId, amount, comment, method } = body || {};

    if (!campaignId || !userId || !amount || !method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const normalizedBase = baseUrl.startsWith("http")
      ? baseUrl
      : `https://${baseUrl}`;

    if (!process.env.PAYWAY_API_KEY) {
      return NextResponse.json(
        { error: "PAYWAY_API_KEY is not set" },
        { status: 500 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SUPABASE_URL is not set" },
        { status: 500 }
      );
    }

    const callbackUrl = buildCallbackUrl({
      baseUrl: normalizedBase,
      campaignId,
      userId,
      amount: Number(amount),
      comment,
      method,
    });

    // Debug: Log the callback URL and environment
    console.log("Generated callback URL:", callbackUrl);
    console.log("PAYWAY_API_KEY exists:", !!process.env.PAYWAY_API_KEY);
    console.log(
      "PAYWAY_API_KEY length:",
      process.env.PAYWAY_API_KEY?.length || 0
    );

    // Here we would call PayWay create payment API.
    // For now, return the callback and a mocked redirect URL placeholder.
    // Replace with real PayWay endpoint integration.
    return NextResponse.json({
      callbackUrl,
      redirectUrl: `${normalizedBase}/api/payway/mock-gateway?return=${encodeURIComponent(
        callbackUrl
      )}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error in /api/payway/create" },
      { status: 500 }
    );
  }
}
