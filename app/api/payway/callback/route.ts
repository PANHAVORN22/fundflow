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

    // Update campaign amount in photo_entries table
    try {
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("photo_entries")
        .select("amounts")
        .eq("id", campaignId)
        .single();

      if (campaignError) {
        console.error("Error fetching campaign:", campaignError);
      } else {
        // Parse current amount and add new donation
        const currentAmount = parseFloat(campaign.amounts || "0");
        const newAmount = currentAmount + amount;

        console.log("Updating campaign amount:", {
          currentAmount,
          newAmount,
          campaignId,
        });

        const { error: updateError } = await supabaseAdmin
          .from("photo_entries")
          .update({ amounts: newAmount.toString() })
          .eq("id", campaignId);

        if (updateError) {
          console.error("Error updating campaign amount:", updateError);
        } else {
          console.log("Campaign amount updated successfully to:", newAmount);
        }
      }
    } catch (error) {
      console.error("Error in campaign update:", error);
    }

    // Insert comment if any
    // TODO: Create donation_comments table or handle comments differently
    // For now, we'll skip comment insertion to avoid the 500 error
    if (comment && comment.trim()) {
      console.log(
        "Comment received but skipping insertion - donation_comments table not yet created:",
        comment.trim()
      );
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
