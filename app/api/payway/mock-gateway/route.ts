import { NextRequest, NextResponse } from "next/server";

// This simulates a gateway that immediately calls back to our callback URL.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("return");
  if (!returnTo) {
    return NextResponse.json(
      { error: "Missing return callback" },
      { status: 400 }
    );
  }
  const callback = new URL(returnTo);
  // Simulate PayWay adding status
  callback.searchParams.set("status", "200");
  return NextResponse.redirect(callback.toString());
}

