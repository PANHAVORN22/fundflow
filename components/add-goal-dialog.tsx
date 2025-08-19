"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddGoalDialogProps {
  userId: string
  onGoalAdded: () => void
}

export default function AddGoalDialog({ userId, onGoalAdded }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    targetDate: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("donation_goals").insert({
        user_id: userId,
        title: formData.title,
        target_amount: Number.parseFloat(formData.targetAmount),
        target_date: formData.targetDate || null,
      })

      if (error) throw error

      toast({
        title: "Goal created",
        description: "Your donation goal has been created successfully.",
      })

      setFormData({
        title: "",
        targetAmount: "",
        targetDate: "",
      })
      setOpen(false)
      onGoalAdded()
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
        <Button
          variant="outline"
          className="border-[#6B8E5A] text-[#6B8E5A] hover:bg-[#6B8E5A] hover:text-white bg-transparent"
        >
          <Target className="w-4 h-4 mr-2" />
          Set Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Donation Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monthly Giving Goal"
              required
            />
          </div>
          <div>
            <Label htmlFor="targetAmount">Target Amount ($)</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="targetDate">Target Date (optional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#6B8E5A] hover:bg-[#5A7A4A]">
              {isLoading ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
