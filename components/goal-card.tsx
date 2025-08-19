import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, Target } from "lucide-react"

interface GoalCardProps {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  currency: string
  targetDate?: string
  isActive: boolean
}

export default function GoalCard({
  title,
  targetAmount,
  currentAmount,
  currency,
  targetDate,
  isActive,
}: GoalCardProps) {
  const progress = (currentAmount / targetAmount) * 100
  const formattedTarget = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(targetAmount)
  const formattedCurrent = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(currentAmount)

  return (
    <Card className={`${isActive ? "border-[#6B8E5A]" : "border-gray-200"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{title}</span>
          {isActive && <div className="w-3 h-3 bg-[#6B8E5A] rounded-full"></div>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{formattedCurrent}</span>
            <span className="font-medium">{formattedTarget}</span>
          </div>
        </div>

        {targetDate && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Target: {new Date(targetDate).toLocaleDateString()}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <Target className="w-4 h-4 mr-2" />
          {isActive ? "Active Goal" : "Completed Goal"}
        </div>
      </CardContent>
    </Card>
  )
}
