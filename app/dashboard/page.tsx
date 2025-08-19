"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import DonationCard from "@/components/donation-card"
import GoalCard from "@/components/goal-card"
import AddDonationDialog from "@/components/add-donation-dialog"
import AddGoalDialog from "@/components/add-goal-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DollarSign, Target, TrendingUp, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Donation {
  id: string
  campaign_title: string
  amount: number
  currency: string
  donation_date: string
  campaign_image_url?: string
}

interface Goal {
  id: string
  title: string
  target_amount: number
  current_amount: number
  currency: string
  target_date?: string
  is_active: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDonated: 0,
    donationCount: 0,
    activeGoals: 0,
    thisMonthDonations: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push("/")
        return
      }

      setUser(session.user)

      // Ensure user profile exists
      await ensureUserProfile(session.user)

      await loadData(session.user.id)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        router.push("/")
      } else {
        setUser(session.user)
        await ensureUserProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const ensureUserProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      // If profile doesn't exist, create it
      if (error && error.code === "PGRST116") {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        })

        if (insertError) {
          console.error("Error creating profile:", insertError)
        }
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error)
    }
  }

  const loadData = async (userId: string) => {
    // Load donations
    const { data: donationsData } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", userId)
      .order("donation_date", { ascending: false })

    // Load goals
    const { data: goalsData } = await supabase
      .from("donation_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (donationsData) {
      setDonations(donationsData)

      // Calculate stats
      const totalDonated = donationsData.reduce((sum, d) => sum + d.amount, 0)
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const thisMonthDonations = donationsData
        .filter((d) => new Date(d.donation_date) >= thisMonth)
        .reduce((sum, d) => sum + d.amount, 0)

      setStats((prev) => ({
        ...prev,
        totalDonated,
        donationCount: donationsData.length,
        thisMonthDonations,
      }))
    }

    if (goalsData) {
      // Update current amounts based on donations
      const updatedGoals = goalsData.map((goal) => {
        const goalDonations = donationsData?.filter((d) => new Date(d.donation_date) >= new Date(goal.created_at)) || []
        const currentAmount = goalDonations.reduce((sum, d) => sum + d.amount, 0)
        return { ...goal, current_amount: currentAmount }
      })

      setGoals(updatedGoals)
      setStats((prev) => ({
        ...prev,
        activeGoals: updatedGoals.filter((g) => g.is_active).length,
      }))
    }
  }

  const handleDataRefresh = () => {
    if (user) {
      loadData(user.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#6B8E5A]">${stats.totalDonated.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.donationCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGoals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#6B8E5A]">${stats.thisMonthDonations.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="donations" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="donations">Donation History</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>
            <div className="flex space-x-2">
              <AddDonationDialog userId={user.id} onDonationAdded={handleDataRefresh} />
              <AddGoalDialog userId={user.id} onGoalAdded={handleDataRefresh} />
            </div>
          </div>

          <TabsContent value="donations" className="space-y-6">
            {donations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No donations yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Start tracking your charitable contributions by adding your first donation.
                  </p>
                  <AddDonationDialog userId={user.id} onDonationAdded={handleDataRefresh} />
                </CardContent>
              </Card>
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
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            {goals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals set</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Set donation goals to track your charitable giving progress.
                  </p>
                  <AddGoalDialog userId={user.id} onGoalAdded={handleDataRefresh} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    id={goal.id}
                    title={goal.title}
                    targetAmount={goal.target_amount}
                    currentAmount={goal.current_amount}
                    currency={goal.currency}
                    targetDate={goal.target_date}
                    isActive={goal.is_active}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
