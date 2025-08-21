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

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    getSession();
  }, []);

  const handleDonate = async () => {
    if (!params?.id) return;
    setLoading(true);

    try {
      // For demo purposes we'll insert a donation with minimal fields
      const donationDate = new Date().toISOString();
  // parse amount to number here so the input can accept free-form typing
  const parsedAmount = parseFloat((amount || "").toString()) || 0;

      // block non-positive donations
      if (parsedAmount <= 0) {
        alert("Please enter a positive amount to donate.");
        setLoading(false);
        return;
      }

      // block non-positive donations
      if (parsedAmount <= 0) {
        alert("Please enter a positive amount to donate.");
        setLoading(false);
        return;
      }

      const { data: donationData, error: donationError } = await supabase
        .from("donations")
        .insert([
          {
            user_id: userId,
            campaign_title: `campaign:${params.id}`,
    amount: parsedAmount,
            currency: "USD",
            donation_date: donationDate,
          },
        ])
        .select()
        .single();

      if (donationError) throw donationError;

      // Insert comment if provided
      if (comment.trim()) {
        const trimmed = comment.trim();
        // If the comment is just a positive number (e.g. "100" or "3.14"), block it
        const numericOnly = /^\s*\d+(?:\.\d+)?\s*$/.test(trimmed);
        if (numericOnly && parseFloat(trimmed) > 0) {
          alert("Please enter a text comment — numeric-only positive comments are not allowed.");
          setLoading(false);
          return;
        }

        const { error: commentError } = await supabase
          .from("donation_comments")
          .insert([
            {
              campaign_id: params.id,
              donation_id: donationData.id,
              user_id: userId,
              message: trimmed,
            },
          ]);

        if (commentError) throw commentError;
      }

      // Redirect back to campaign detail
      router.push(`/campaign/${params.id}`);
    } catch (err) {
      console.error("Donation error:", err);
      alert("Donation failed. Check console for details.");
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
              <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm">
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

              <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-30 h-10 text-white rounded-full flex items-center justify-center">
                    <Image src="/credit.png" alt="credit-card" width={50} height={50} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 whitespace-nowrap">
                      <Image src="/visa-svgrepo-com.svg" alt="Visa" width={25} height={25} className="inline-block" />
                      <Image src="/images/mastercard-svgrepo-com.svg" alt="MasterCard" width={25} height={25} className="inline-block" />
                      <Image src="/images/unionpay-svgrepo-com.svg" alt="unionpay" width={25} height={25} className="inline-block" />
                      <Image src="/images/jcb-svgrepo-com.svg" alt="jcb" width={25} height={25} className="inline-block" />
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
    </div>
  );
}
