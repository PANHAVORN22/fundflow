"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import DonationCard from "@/components/donation-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, DollarSign } from "lucide-react";

interface Donation {
  id: string;
  campaign_title: string;
  amount: number;
  currency: string;
  donation_date: string;
  campaign_image_url?: string;
}

export default function DonationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);

        if (session?.user) {
          const { data } = await supabase
            .from("donations")
            .select("*")
            .eq("user_id", session.user.id)
            .order("donation_date", { ascending: false });

          if (data) setDonations(data);
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-3">Your Donations</h1>
          <p className="text-gray-600 mb-6">
            Sign in to view and manage your donation history.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/auth">Sign in</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Donation History</h1>
        </div>

        {donations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border">
            <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No donations yet
            </h3>
            <p className="text-gray-600 mb-4">
              Make your first donation from the dashboard.
            </p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                id={donation.id}
                campaignTitle={donation.campaign_title}
                amount={donation.amount}
                currency={donation.currency}
                donationDate={donation.donation_date}
                campaignImageUrl={donation.campaign_image_url}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
