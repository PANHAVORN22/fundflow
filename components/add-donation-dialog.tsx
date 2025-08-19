"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddDonationDialogProps {
  userId: string
  onDonationAdded: () => void
}

export default function AddDonationDialog({ userId, onDonationAdded }: AddDonationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    campaignTitle: "",
    amount: "",
    donationDate: new Date().toISOString().split("T")[0],
    campaignImageUrl: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("donations").insert({
        user_id: userId,
        campaign_title: formData.campaignTitle,
        amount: Number.parseFloat(formData.amount),
        donation_date: formData.donationDate,
        campaign_image_url: formData.campaignImageUrl || null,
      })

      if (error) throw error

      toast({
        title: "Donation added",
        description: "Your donation has been recorded successfully.",
      })

      setFormData({
        campaignTitle: "",
        amount: "",
        donationDate: new Date().toISOString().split("T")[0],
        campaignImageUrl: "",
      })
      setOpen(false)
      onDonationAdded()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#6B8E5A] hover:bg-[#5A7A4A]">
          <Plus className="w-4 h-4 mr-2" />
          Add Donation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Donation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaignTitle">Campaign Title</Label>
            <Input
              id="campaignTitle"
              value={formData.campaignTitle}
              onChange={(e) => setFormData({ ...formData, campaignTitle: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="donationDate">Donation Date</Label>
            <Input
              id="donationDate"
              type="date"
              value={formData.donationDate}
              onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="campaignImageUrl">Campaign Image URL (optional)</Label>
            <Input
              id="campaignImageUrl"
              type="url"
              value={formData.campaignImageUrl}
              onChange={(e) => setFormData({ ...formData, campaignImageUrl: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#6B8E5A] hover:bg-[#5A7A4A]">
              {isLoading ? "Adding..." : "Add Donation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
