import { NextRequest, NextResponse } from "next/server";
import { buildCallbackUrl } from "@/lib/payway";
import { generateAbaHmacSignature } from "@/lib/payway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, userId, amount, comment, method } = body || {};

    console.log("PayWay create request received:", {
      campaignId,
      userId,
      amount,
      comment,
      method,
    });

    if (!campaignId || !userId || !amount || !method) {
      console.error("Missing required fields:", {
        campaignId,
        userId,
        amount,
        method,
      });
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

    console.log("Environment check:", {
      PAYWAY_API_KEY_EXISTS: !!process.env.PAYWAY_API_KEY,
      PAYWAY_API_KEY_LENGTH: process.env.PAYWAY_API_KEY?.length || 0,
      NEXT_PUBLIC_SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      baseUrl,
      normalizedBase,
    });

    if (!process.env.PAYWAY_API_KEY) {
      console.error("PAYWAY_API_KEY is not set");
      return NextResponse.json(
        { error: "PAYWAY_API_KEY is not set" },
        { status: 500 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not set");
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SUPABASE_URL is not set" },
        { status: 500 }
      );
    }

    // Build our callback URL for PayWay to call after payment
    const callbackUrl = buildCallbackUrl({
      baseUrl: normalizedBase,
      campaignId,
      userId,
      amount: Number(amount),
      comment,
      method,
    });

    console.log("Our callback URL:", callbackUrl);

    let paywayData: any;
    const dateStr = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const randomStr = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const tran_id = `t${dateStr}${randomStr}`.substring(0, 20);
    function formatPaywayDate(date: Date = new Date()): string {
      return date
        .toISOString()
        .replace(/[-:T.]/g, "")
        .slice(0, 14);
    }
    const req_time = formatPaywayDate();

    try {
      // Call PayWay's purchase API to create a real payment session
      const paywayResponse = await fetch(
        "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            req_time: req_time,
            merchant_id: process.env.ABA_MERCHANT_ID,
            tran_id: tran_id,
            amount: amount * 100,
            currency: "USD",
            view_type: "hosted_view",
            return_url: callbackUrl,
            cancel_url: `${normalizedBase}/campaign/${campaignId}?cancelled=1`,
            hash: generateAbaHmacSignature(
              {
                req_time: req_time,
                merchant_id: process.env.ABA_MERCHANT_ID,
                tran_id: tran_id,
                amount: amount * 100,
                currency: "USD",
                return_url: callbackUrl,
                cancel_url: `${normalizedBase}/campaign/${campaignId}?cancelled=1`,
              },
              process.env.PAYWAY_API_KEY
            ).signatureBase64,

            // Add any other PayWay-specific fields here
          }),
        }
      );

      console.log("PayWay API request:", paywayResponse.body);

      console.log("PayWay API response:", paywayResponse);

      if (!paywayResponse.ok) {
        const paywayError = await paywayResponse.json().catch(() => ({}));
        console.error("PayWay API error:", paywayError);
        throw new Error(
          `PayWay API error: ${paywayResponse.status} - ${
            paywayError.message || "Unknown error"
          }`
        );
      }

      paywayData = await paywayResponse.json();
      console.log("PayWay API response:", paywayData);

      // PayWay should return a payment URL (KHQR code, payment page, etc.)
      if (!paywayData.payment_url && !paywayData.qr_code) {
        throw new Error("PayWay did not return a payment URL or QR code");
      }

      // Always generate QR code from payment URL for real-life scanning
      let qrCodeUrl = null;
      if (paywayData.payment_url) {
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          paywayData.payment_url
        )}`;
      } else if (paywayData.qr_code) {
        // Fallback: if PayWay directly returns QR code, use it
        qrCodeUrl = paywayData.qr_code;
      }

      return NextResponse.json({
        success: true,
        qrCodeUrl,
        paymentUrl: paywayData.payment_url || paywayData.qr_code,
        paymentId: paywayData.payment_id || paywayData.id,
        isMock: false,
        callbackUrl, // For debugging
      });
    } catch (error: any) {
      console.warn(
        "PayWay API call failed, using development fallback:",
        error.message
      );

      // Development fallback - create a mock payment flow
      // This allows testing the payment flow without a real PayWay integration
      paywayData = {
        payment_url: `${normalizedBase}/api/payway/mock-gateway?return=${encodeURIComponent(
          callbackUrl
        )}`,
        payment_id: `mock_${Date.now()}`,
        is_mock: true,
      };

      console.log("Created mock payment flow:", paywayData.payment_url);

      return NextResponse.json({
        success: true,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          paywayData.payment_url
        )}`,
        paymentUrl: paywayData.payment_url,
        paymentId: paywayData.payment_id,
        isMock: true,
        callbackUrl, // For debugging
      });
    }
  } catch (err: any) {
    console.error("Error in /api/payway/create:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error in /api/payway/create" },
      { status: 500 }
    );
  }
}
