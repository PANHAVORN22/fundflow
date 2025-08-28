"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import PublicHeader from "@/components/public-header";
import AuthenticatedHeader from "@/components/authenticated-header";
import PublicFooter from "@/components/public-footer";
import CampaignCard from "@/components/campaign-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const sampleCampaigns = [
  {
    id: 1,
    title:
      "Explosion from Thailand destroys Cambodian home. They only lost two plates, but going there means everything. Help us rebuild.",
    description:
      "A devastating explosion has left a Cambodian family homeless. Every donation helps rebuild their lives.",
    amountRaised: "1201322",
    imageUrl: "/placeholder.svg?height=400&width=600",
    featured: true,
    progress: 80,
  },
  {
    id: 2,
    title:
      "Join us in helping Khmer victims in need—every donation makes a difference",
    description:
      "Supporting Khmer communities affected by recent tragedies with essential aid and resources.",
    amountRaised: "120343",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUIXOVMoqvx_sSnpwrcJ3eh5061YFCpQ9q0M_lD_f6JB6TL1oVoffy5SRwybJQlJUB-8o&usqp=CAU?height=300&width=400",
    progress: 50,
  },
  {
    id: 3,
    title:
      "Fundraiser for Khmer Victims: Stand with those affected by this tragedy.",
    description:
      "Standing together to provide immediate relief and long-term support for affected families.",
    amountRaised: "12033",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEGPNyGbVTCAMdHmIqHOwtVkCkLDi8LUFuOQ&s?height=300&width=400",
    progress: 80,
  },
  {
    id: 4,
    title:
      "Emergency Aid for Khmer Victims – Your contribution can save lives.",
    description:
      "Providing critical emergency aid including food, shelter, and medical assistance.",
    amountRaised: "120113",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThL7-fHXJF9_nSExf-WsGwUeL92GtIHi9_sQ&s?height=300&width=400",
    progress: 60,
  },
  {
    id: 5,
    title:
      "Together for Khmer Victims – Donate now to support food, shelter, and care.",
    description:
      "Comprehensive support program providing essential needs for displaced families.",
    amountRaised: "1203",
    imageUrl:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fenglish.alarabiya.net%2FNews%2Fworld%2F2025%2F07%2F26%2Fdeath-toll-rises-in-thai-cambodian-clashes-despite-ceasefire-call&psig=AOvVaw1Gs24OZJBQjDBdf3hF5FzS&ust=1754729959310000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCMDq7Yrt-o4DFQAAAAAdAAAAABAp?height=300&width=400",
    progress: 65,
  },
];

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Trending");
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error getting session:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load uploaded photo entries to show on the homepage
  useEffect(() => {
    const loadEntries = async () => {
      const { data } = await supabase
        .from("photo_entries")
        .select("*")
        .order("created_at", { ascending: false });
      setEntries(data ?? []);
    };
    loadEntries();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const filters = ["Trending", "Upload", "Donation"];
  function handleFilterChange(filter: string) {
    const path = `/${filter.toLowerCase()}`;
    router.push(path);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Show different headers based on authentication status */}
      {user ? <AuthenticatedHeader userEmail={user.email} /> : <PublicHeader />}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {user
              ? "Discover Fundraising Campaigns"
              : "Search Fundraising Campaigns"}
          </h1>
          <p className="text-gray-600 mb-8">
            {user
              ? "Explore campaigns and track your donations from your personalized dashboard."
              : "You can search for fundraisers using a person's name, city, or keyword."}
          </p>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-gray-100 border-0 rounded-full py-6 text-lg"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-center space-x-4 mb-8">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                onClick={() => handleFilterChange(filter)}
                className={
                  activeFilter === filter
                    ? "bg-black text-white hover:bg-gray-800 rounded-full"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full border-0"
                }
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Welcome Message for Signed-in Users */}
        {user && (
          <div className="bg-[#6B8E5A] text-white rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
                <p className="text-green-100">
                  Continue exploring campaigns and track your donations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Grid with Horizontal Scrolling */}
        <div className="w-full">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {/* Show uploaded entries only */}
            {entries.map((e) => (
              <div key={e.id} className="w-80 flex-shrink-0 first:ml-0">
                <CampaignCard
                  id={e.id}
                  title={
                    e.purpose ||
                    `${(e.first_name || "").trim()} ${(
                      e.last_name || ""
                    ).trim()}`.trim() ||
                    "Photo entry"
                  }
                  description={e.description || "Uploaded photo entry"}
                  amountRaised={`${e.amounts || "0"}`}
                  imageUrl={e.photo_url || "/placeholder.svg"}
                  progress={Math.floor(Math.random() * 100) + 1}
                />
              </div>
            ))}

            {/* Show message if no entries yet */}
            {entries.length === 0 && (
              <div className="w-full text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No photo entries yet
                </h3>
                <p className="text-gray-600">
                  Be the first to upload a photo entry!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
