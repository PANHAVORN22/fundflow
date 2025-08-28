"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";

export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    getSession();
  }, []);

  const startPayment = async (method: "aba" | "card") => {
    if (!params?.id) return;
    setLoading(true);

    try {
      // Require auth (RLS on donations requires user_id = auth.uid())
      if (!userId) {
        alert("Please sign in to donate.");
        router.push("/auth");
        return;
      }

      // parse amount to number here so the input can accept free-form typing
      const parsedAmount = parseFloat((amount || "").toString()) || 0;

      // block non-positive donations
      if (parsedAmount <= 0) {
        alert("Please enter a positive amount to donate.");
        setLoading(false);
        return;
      }
      // Optional: basic comment sanity check (avoid numeric-only positives)
      if (comment.trim()) {
        const trimmed = comment.trim();
        const numericOnly = /^\s*\d+(?:\.\d+)?\s*$/.test(trimmed);
        if (numericOnly && parseFloat(trimmed) > 0) {
          alert(
            "Please enter a text comment — numeric-only positive comments are not allowed."
          );
          setLoading(false);
          return;
        }
      }

      // Persist pending comment locally as a fallback (in case server callback can't insert)
      try {
        if (comment.trim()) {
          const key = `pending_comment_${String(params.id)}`;
          localStorage.setItem(
            key,
            JSON.stringify({
              message: comment.trim(),
              amount: parsedAmount,
              userId,
              ts: Date.now(),
            })
          );
        }
      } catch {}

      // Create payment session and redirect to gateway
      const resp = await fetch("/api/payway/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: String(params.id),
          userId,
          amount: parsedAmount,
          comment: comment.trim() || undefined,
          method,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          err?.error || `Failed to create payment: ${resp.status}`
        );
      }

      const data = await resp.json();
      if (data?.redirectUrl) {
        // For ABA, show QR modal so user can scan or open payment
        if (method === "aba") {
          const redirect = String(data.redirectUrl);
          setQrUrl(redirect);
          try {
            const durl = await QRCode.toDataURL(redirect, { width: 240, margin: 1 });
            setQrDataUrl(durl);
          } catch (e) {
            console.warn("Failed generating local QR, will fallback to external service", e);
            setQrDataUrl("");
          }
          return;
        }
        // For card, just redirect to gateway/mock
        window.location.href = data.redirectUrl;
        return;
      }
      throw new Error("Missing redirect url from gateway");
    } catch (err: any) {
      console.error("Donation error:", err);
      const message =
        err?.message || (typeof err === "string" ? err : "Unknown error");
      alert(`Donation failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3e7f3c] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-gray-100 rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Donate Page</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: payment options */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-6">Choose way to pay</h3>

            <div className="space-y-4">
              <button
                disabled={loading}
                onClick={() => startPayment("aba")}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-30 h-10 text-white rounded-full flex items-center justify-center">
                    <Image src="/aba.png" alt="ABA" width={100} height={100} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">ABA KHQR</div>
                    <div className="text-sm text-gray-500">
                      Scan to pay with any banking app
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                disabled={loading}
                onClick={() => startPayment("card")}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-30 h-10 text-white rounded-full flex items-center justify-center">
                    <Image
                      src="/credit.png"
                      alt="credit-card"
                      width={50}
                      height={50}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 whitespace-nowrap">
                      <Image
                        src="/visa-svgrepo-com.svg"
                        alt="Visa"
                        width={25}
                        height={25}
                        className="inline-block"
                      />
                      <Image
                        src="/images/mastercard-svgrepo-com.svg"
                        alt="MasterCard"
                        width={25}
                        height={25}
                        className="inline-block"
                      />
                      <Image
                        src="/images/unionpay-svgrepo-com.svg"
                        alt="unionpay"
                        width={25}
                        height={25}
                        className="inline-block"
                      />
                      <Image
                        src="/images/jcb-svgrepo-com.svg"
                        alt="jcb"
                        width={25}
                        height={25}
                        className="inline-block"
                      />
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {(qrDataUrl || qrUrl) && (
                <div className="mt-4 p-4 rounded-lg border bg-white">
                  <div className="font-semibold mb-2">Scan to Pay (ABA KHQR)</div>
                  <div className="flex flex-col items-center gap-3">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="KHQR"
                        width={240}
                        height={240}
                        className="rounded-md border"
                      />
                    ) : qrUrl ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=240x240`}
                        alt="KHQR"
                        width={240}
                        height={240}
                        className="rounded-md border"
                      />
                    ) : null}
                    <div className="text-sm text-gray-600">
                      Amount: <span className="font-semibold">{amount || 0}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Open ABA Mobile and scan this QR to complete your donation.
                    </div>
                    {qrUrl && (
                      <Button
                        onClick={() => {
                          window.location.href = qrUrl;
                        }}
                        className="bg-[#6B8E5A] hover:bg-[#5A7A4A]"
                      >
                        Open Payment
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-start">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/campaign/${params.id}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>

          {/* Right column: amount and comments */}
          <div className="lg:col-span-1 bg-white rounded-xl p-6">
            <div className="mb-4">
              <label className="text-sm text-gray-600">Amounts</label>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e: any) => {
                  const v = (e.target as HTMLInputElement).value;
                  // Prevent entering negative values (leading '-')
                  if (v.startsWith("-")) return;
                  setAmount(v);
                }}
                placeholder="Amounts"
                className="mt-2"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-600">Comments</label>
              <Textarea
                value={comment}
                onChange={(e: any) => setComment(e.target.value)}
                placeholder="Type...."
                className="mt-2 h-40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
