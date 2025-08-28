"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Heart,
  Trophy,
  User,
  MessageCircle,
  Clock,
} from "lucide-react";
import Image from "next/image";

interface Campaign {
  id: string;
  title: string;
  description: string;
  amountRaised: string;
  goal: string;
  donations: number;
  progress: number;
  imageUrl: string;
  organizer: string;
  lifetime: string;
}

interface Donation {
  id: string;
  name: string;
  amount: string;
  type: "recent" | "top" | "first";
  message?: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [comments, setComments] = useState<
    { id: string; message: string; created_at?: string; user_id?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showOrganizerDetails, setShowOrganizerDetails] = useState(false);
  const searchParams = useSearchParams();
  const paid = searchParams?.get("paid") === "1";

  useEffect(() => {
    const loadCampaign = async () => {
      if (!params?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch campaign / photo entry
        const { data, error } = await supabase
          .from("photo_entries")
          .select("*")
          .eq("id", params.id as string)
          .maybeSingle();

        if (error) {
          // Log only unexpected errors
          if ((error as any)?.code !== "PGRST116") {
            console.error("Error loading campaign:", error);
          }
          setCampaign(null);
          setDonations([]);
          setComments([]);
          return;
        }

        if (!data) {
          setCampaign(null);
          setDonations([]);
          setComments([]);
          return;
        }

        const organizerName =
          `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
          "Anonymous";
        const createdAt = data.created_at
          ? new Date(data.created_at)
          : new Date();
        const daysAgo = Math.max(
          0,
          Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        );

        setCampaign({
          id: data.id,
          title: data.purpose || organizerName || "Photo entry",
          description: data.description || "",
          amountRaised: data.amounts || "0",
          goal: "N/A",
          donations: 0,
          progress: 0,
          imageUrl: data.photo_url || "/placeholder.svg",
          organizer: organizerName,
          lifetime: daysAgo === 0 ? "today" : `${daysAgo} days ago`,
        });

        // Load donations for this campaign and map to recent/top/first slots
        try {
          const { data: donationRows } = await supabase
            .from("donations")
            .select("*")
            .eq("campaign_title", `campaign:${params.id}`)
            .order("donation_date", { ascending: true });

          if (donationRows && (donationRows as any).length > 0) {
            const rows = donationRows as any[];

            // Resolve profile names for the user_ids in one query
            const userIds = Array.from(
              new Set(rows.map((r) => r.user_id).filter(Boolean))
            );
            const profilesMap = new Map<string, string>();
            if (userIds.length) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, first_name, last_name")
                .in("id", userIds as string[]);

              (profiles || []).forEach((p: any) => {
                const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
                profilesMap.set(p.id, name || "Anonymous");
              });
            }

            // pick first (earliest), recent (latest), and top (max amount)
            const firstRow = rows[0];
            const recentRow = rows[rows.length - 1];
            const topRow = rows.reduce((best, cur) => {
              const bestAmt = parseFloat(best.amount ?? 0);
              const curAmt = parseFloat(cur.amount ?? 0);
              return curAmt > bestAmt ? cur : best;
            }, rows[0]);

            const result: Donation[] = [];
            const pushed = new Set<string>();
            const pushIf = (row: any, type: Donation["type"]) => {
              if (!row) return;
              const id = String(row.id);
              if (pushed.has(id)) return;
              pushed.add(id);
              const name = profilesMap.get(row.user_id) || row.user_id || "Anonymous";
              result.push({ id, name, amount: String(row.amount ?? "0"), type });
            };

            // Order: recent, top, first (keeps UI similar to previous ordering)
            pushIf(recentRow, "recent");
            pushIf(topRow, "top");
            pushIf(firstRow, "first");

            setDonations(result);
          } else {
            // fallback to placeholder donations if none in DB
            setDonations([
              { id: "1", name: "Pichsovan Chintey", amount: "100", type: "recent" },
              { id: "2", name: "Smos Sne", amount: "10000", type: "top" },
              { id: "3", name: "Yun mengheng", amount: "10", type: "first" },
            ]);
          }
        } catch (err) {
          console.error("Error loading donations:", err);
          setDonations([
            { id: "1", name: "Pichsovan Chintey", amount: "100", type: "recent" },
            { id: "2", name: "Smos Sne", amount: "10000", type: "top" },
            { id: "3", name: "Yun mengheng", amount: "10", type: "first" },
          ]);
        }

        // Load comments for this campaign
        const { data: commentRows } = await supabase
          .from("donation_comments")
          .select("*")
          .eq("campaign_id", params.id as string)
          .order("created_at", { ascending: false });

        setComments((commentRows as any) ?? []);
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [params.id]);

  // Realtime updates for donation comments on this campaign
  useEffect(() => {
    const campaignId = params?.id as string | undefined;
    if (!campaignId) return;

    const channel = supabase
      .channel(`comments:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_comments',
          filter: `campaign_id=eq.${campaignId}`,
        } as any,
        (payload: any) => {
          const row = payload?.new;
          if (!row) return;
          setComments((prev) => [row, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'donation_comments',
          filter: `campaign_id=eq.${campaignId}`,
        } as any,
        (payload: any) => {
          const row = payload?.old;
          if (!row) return;
          setComments((prev) => prev.filter((c: any) => c.id !== row.id));
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-[#6B8E5A] text-3xl font-bold italic">
            Fundflow
          </div>
          <Button variant="outline">Sign out</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {paid && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            <div className="font-semibold">Thank you! Your donation was successful.</div>
            <div className="text-sm">We appreciate your support for this campaign.</div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Campaign Content */}
          <div className="lg:col-span-2">
            {/* Campaign Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {campaign.title}
            </h1>

            {/* Campaign Image */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
              <Image
                src={campaign.imageUrl}
                alt={campaign.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Organizer Info - Clickable */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <span className="text-gray-700">
                <button
                  onClick={() => setShowOrganizerDetails(!showOrganizerDetails)}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  {campaign.organizer}
                </button>{" "}
                is organizing this fundraiser.
              </span>
            </div>

            {/* Organizer Details Modal */}
            {showOrganizerDetails && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Campaigner Details</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <strong>Name:</strong> {campaign.organizer}
                    </div>
                    <div>
                      <strong>Location:</strong> Cambodia
                    </div>
                    <div>
                      <strong>Campaigns Created:</strong> 3
                    </div>
                    <div>
                      <strong>Total Raised:</strong> $15,000
                    </div>
                    <div>
                      <strong>Trust Score:</strong> ⭐⭐⭐⭐⭐
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowOrganizerDetails(false)}
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Campaign Description */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {campaign.description}
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-[#6B8E5A] mb-2">
                    ${parseInt(campaign.amountRaised).toLocaleString()} USD
                    raised
                  </div>
                  <div className="text-gray-600 mb-4">
                    ${campaign.goal} goal
                  </div>
                  <div className="text-gray-600 mb-4">
                    {campaign.donations.toLocaleString()} donations
                  </div>
                  <Progress value={campaign.progress} className="mb-4" />
                  <div className="text-sm text-gray-500">
                    {campaign.progress}% complete
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button className="w-full bg-gray-800 hover:bg-gray-900">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    className="w-full bg-[#6B8E5A] hover:bg-[#5A7A4A]"
                    onClick={() => {
                      if (campaign?.id)
                        router.push(`/campaign/${campaign.id}/donate`);
                    }}
                  >
                    <Link
                      href={`/campaign/${campaign?.id}/donate`}
                      className="w-full bg-[#6B8E5A] hover:bg-[#5A7A4A] inline-flex items-center justify-center py-2 px-3 rounded"
                    >
                      Donate now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Donations */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                  <h3 className="font-semibold">1000 People just donated</h3>
                </div>

                <div className="space-y-3">
                  {donations.map((donation) => (
                    <div key={donation.id} className="flex items-center gap-3">
                      {donation.type === "recent" && (
                        <Heart className="w-4 h-4 text-red-500" />
                      )}
                      {donation.type === "top" && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      {donation.type === "first" && (
                        <User className="w-4 h-4 text-blue-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{donation.name}</div>
                        <div className="text-sm text-gray-600">
                          ${donation.amount} •{" "}
                          {donation.type === "recent"
                            ? "Recent donation"
                            : donation.type === "top"
                            ? "Top donation"
                            : "First donation"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lifetime Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold">Campaign Lifetime</h3>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6B8E5A] mb-2">
                    {campaign.lifetime}
                  </div>
                  <div className="text-sm text-gray-600">
                    Time remaining to reach goal
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Words of Support Section */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Words of support ({comments.length})
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/campaign/${params.id}/donate`)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Please donate to share words of support
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!params?.id) return;
                      if (!confirm("Delete all comments for this campaign?")) return;
                      try {
                        const res = await fetch("/api/comments/clear", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ campaignId: String(params.id) }),
                        });
                        if (!res.ok) {
                          const j = await res.json().catch(() => ({}));
                          throw new Error(j?.error || `Failed: ${res.status}`);
                        }
                        // reload comments
                        const { data: commentRows } = await supabase
                          .from("donation_comments")
                          .select("*")
                          .eq("campaign_id", params.id as string)
                          .order("created_at", { ascending: false });
                        setComments((commentRows as any) ?? []);
                      } catch (e: any) {
                        alert(e?.message || "Failed to clear comments");
                      }
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              {comments.length === 0 ? (
                <div className="text-gray-600 text-sm">No words of support yet.</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Supporter</span>
                          {c.created_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
