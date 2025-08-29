import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/payway";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const qp = url.searchParams;

    // Debug: Log the query parameters and signature
    console.log("Callback query params:", Object.fromEntries(qp.entries()));
    console.log("PAYWAY_API_KEY exists:", !!process.env.PAYWAY_API_KEY);
    console.log(
      "PAYWAY_API_KEY length:",
      process.env.PAYWAY_API_KEY?.length || 0
    );

    // Verify our own signature to ensure callback isn't tampered
    if (!verifySignature(qp)) {
      console.log("Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Signature verification passed");

    const status = qp.get("status") || "200"; // PayWay should provide
    const userId = qp.get("user");
    const campaignId = qp.get("campaign");
    const amount = Number(qp.get("amount") || 0);
    const method = qp.get("method") || "aba";
    const comment = qp.get("comment") || undefined;

    if (status !== "200") {
      return NextResponse.json({ ok: false, status }, { status: 200 });
    }

    if (!userId || !campaignId || !amount) {
      return NextResponse.json(
        { error: "Missing required params" },
        { status: 400 }
      );
    }

    // Insert donation
    const donationDate = new Date().toISOString();
    console.log("Attempting to insert donation:", {
      user_id: userId,
      campaign_title: `campaign:${campaignId}`,
      amount,
      currency: "USD",
      donation_date: donationDate,
      campaign_image_url: null,
      comment: comment || "No comment",
      hasComment: !!comment,
    });

    const { data: donation, error: donationError } = await supabaseAdmin
      .from("donations")
      .insert([
        {
          user_id: userId,
          campaign_title: `campaign:${campaignId}`,
          amount,
          currency: "USD",
          donation_date: donationDate,
          campaign_image_url: null,
          comment: comment || null,
          campaign_id: campaignId,
        },
      ])
      .select()
      .single();

    if (donationError) {
      console.error("Donation insert error:", donationError);
      return NextResponse.json(
        { error: donationError.message },
        { status: 500 }
      );
    }

    console.log("Donation inserted successfully:", donation);

    // DON'T update the amounts field - it's the GOAL amount and should stay fixed!
    // The amount raised is calculated from the donations table, not stored in photo_entries
    console.log(
      "Campaign goal amount stays fixed - not updating amounts field"
    );

    // Comment is now saved directly in the donations table
    if (comment && comment.trim()) {
      console.log("Comment saved with donation:", comment.trim());
    }

    // Redirect back to campaign page with success query
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const normalizedBase = String(baseUrl).startsWith("http")
      ? baseUrl
      : `https://${baseUrl}`;
    const redirectUrl = `${normalizedBase}/campaign/${campaignId}?paid=1`;

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
