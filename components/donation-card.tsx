import { Card, CardContent } from "@/components/ui/card"
import { Calendar, DollarSign } from "lucide-react"
import Image from "next/image"

interface DonationCardProps {
  id: string
  campaignTitle: string
  amount: number
  currency: string
  donationDate: string
  campaignImageUrl?: string
}

export default function DonationCard({
  campaignTitle,
  amount,
  currency,
  donationDate,
  campaignImageUrl,
}: DonationCardProps) {
  const formattedDate = new Date(donationDate).toLocaleDateString()
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative bg-gray-100">
        {campaignImageUrl ? (
          <Image src={campaignImageUrl || "/placeholder.svg"} alt={campaignTitle} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <DollarSign className="w-12 h-12" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate">{campaignTitle}</h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formattedDate}
          </div>
          <div className="font-semibold text-[#6B8E5A]">{formattedAmount}</div>
        </div>
      </CardContent>
    </Card>
  )
}
