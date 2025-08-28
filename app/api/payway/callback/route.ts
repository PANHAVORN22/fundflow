import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/payway";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
    const supabaseAdmin = getSupabaseAdmin();
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
        },
      ])
      .select()
      .single();

    if (donationError) {
      return NextResponse.json(
        { error: donationError.message },
        { status: 500 }
      );
    }

    // Insert comment if any
    if (comment && comment.trim()) {
      const { error: commentError } = await supabaseAdmin
        .from("donation_comments")
        .insert([
          {
            campaign_id: campaignId,
            donation_id: donation.id,
            user_id: userId,
            message: comment.trim(),
          },
        ]);
      if (commentError) {
        return NextResponse.json(
          { error: commentError.message },
          { status: 500 }
        );
      }
    }

    // Update campaign total (store latest amount in photo_entries.amounts as a string sum)
    try {
      const { data: current } = await supabaseAdmin
        .from("photo_entries")
        .select("amounts")
        .eq("id", campaignId)
        .maybeSingle();
      const prev = Number((current as any)?.amounts || 0) || 0;
      const next = (prev + amount).toString();
      await supabaseAdmin
        .from("photo_entries")
        .update({ amounts: next })
        .eq("id", campaignId);
    } catch (e) {
      console.warn("Failed to update campaign total", e);
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
