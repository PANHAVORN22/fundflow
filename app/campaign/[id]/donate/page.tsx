"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"aba" | "card">("aba");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [khqrSeconds, setKhqrSeconds] = useState<number>(180);

  useEffect(() => {
    if (showPaymentModal && paymentMethod === "aba") {
      setKhqrSeconds(180);
      const t = setInterval(() => {
        setKhqrSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
      return () => clearInterval(t);
    }
  }, [showPaymentModal, paymentMethod]);

  const formatMMSS = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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

    // Basic validation
    if (!userId) {
      alert("Please sign in to donate.");
      router.push("/auth");
      return;
    }

    const parsedAmount = parseFloat((amount || "").toString()) || 0;
    if (parsedAmount <= 0) {
      alert("Please enter a positive amount to donate.");
      return;
    }

    try {
      if (method === "aba") {
        // Ask backend to create session and give us callback + redirect
        const resp = await fetch("/api/payway/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: String(params.id),
            userId,
            amount: parsedAmount,
            comment: comment.trim() || undefined,
            method: "aba",
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(
            err?.error || `Failed to create payment: ${resp.status}`
          );
        }

        const data = await resp.json();

        if (data.success) {
          // Set the QR code URL from the API response
          setQrUrl(data.qrCodeUrl);
          setGatewayUrl(data?.paymentUrl || null);
          setPaymentMethod("aba");
        } else {
          console.error("Failed to create payment:", data.error);
          alert("Failed to create payment. Please try again.");
          return;
        }

        setShowPaymentModal(true);
        return;
      }

      // Card flow - open a modal before going to gateway
      if (method === "card") {
        const resp = await fetch("/api/payway/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: String(params.id),
            userId,
            amount: parsedAmount,
            comment: comment.trim() || undefined,
            method: "card",
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(
            err?.error || `Failed to create payment: ${resp.status}`
          );
        }

        const data = await resp.json();
        setGatewayUrl(data?.redirectUrl || null);
        setPaymentMethod("card");
        setShowPaymentModal(true);
        return;
      }
    } catch (e: any) {
      alert(e?.message || "Failed to start payment");
    }
  };

  const closePayment = () => {
    setShowPaymentModal(false);
    setQrUrl(null);
    setGatewayUrl(null);
  };
  const simulateSuccessfulPayment = async (amount: number) => {
    try {
      // Create donation record with comment
      const { error } = await supabase.from("donations").insert({
        user_id: userId,
        campaign_title: `campaign:${params.id}`,
        amount,
        currency: "USD",
        donation_date: new Date().toISOString(),
        campaign_image_url: null,
        comment: comment.trim() || null,
        campaign_id: params.id,
      });

      if (error) throw error;

      // DON'T update the amounts field - it's the GOAL amount and should stay fixed!
      // The amount raised is calculated from the donations table, not stored in photo_entries
      console.log(
        "Campaign goal amount stays fixed - not updating amounts field"
      );

      alert("Payment successful! Your donation has been recorded.");
      router.push(`/campaign/${params.id}?paid=1`);
    } catch (error: any) {
      console.error("Error recording donation:", error);
      alert(
        "Payment processed but failed to record donation. Please contact support."
      );
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
      {/* Payment QR Modal (ABA) */}
      {showPaymentModal && paymentMethod === "aba" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-0 text-center shadow-xl">
            {/* Close */}
            <button
              onClick={closePayment}
              className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            {/* Simulated ABA KHQR card */}
            <div className="mx-auto mt-6 mb-4 w-[300px] rounded-xl border border-gray-200 overflow-hidden text-left">
              {/* Header */}
              <div className="relative bg-gradient-to-b from-red-500 to-red-600 h-10 flex items-center px-3 text-white text-xs font-semibold">
                <span className="uppercase tracking-wider">KHQR</span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/15 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {formatMMSS(khqrSeconds)}
                </span>
              </div>
              {/* Body */}
              <div className="bg-white px-4 pt-3 pb-4">
                <div className="text-[11px] text-gray-500 mb-1">Amount</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  ${parseFloat((amount || "0").toString()).toFixed(2)} USD
                </div>
                <div className="flex items-center justify-center">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="KHQR"
                      className="w-48 h-48 rounded-md border"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-md border flex items-center justify-center text-sm text-gray-500">
                      QR not available
                    </div>
                  )}
                </div>
                <div className="mt-2 text-[10px] text-center text-gray-500 leading-snug">
                  Scan with Bakong App or Mobile Banking apps that support KHQR
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6">
              <a
                href={qrUrl || undefined}
                download
                className="inline-flex items-center justify-center w-full border rounded py-2 text-sm mb-2 hover:bg-gray-50 disabled:opacity-50"
              >
                Download QR
              </a>
              <button
                disabled={!gatewayUrl}
                onClick={() =>
                  gatewayUrl && (window.location.href = gatewayUrl)
                }
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded"
              >
                Pay ${parseFloat((amount || "0").toString()).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit/Debit Card Modal */}
      {showPaymentModal && paymentMethod === "card" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Credit/Debit Card</h3>
              <button
                onClick={closePayment}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Card number
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="4378 9200 1600 4207"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Expiry date
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="03/32"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    CVV
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="***"
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Subtotal:</span>
                <span>
                  ${parseFloat((amount || "0").toString()).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Transaction fee:</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>TOTAL:</span>
                <span>
                  ${parseFloat((amount || "0").toString()).toFixed(2)} USD
                </span>
              </div>
            </div>
            <button
              disabled={!gatewayUrl}
              onClick={() => gatewayUrl && (window.location.href = gatewayUrl)}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded"
            >
              Pay ${parseFloat((amount || "0").toString()).toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
