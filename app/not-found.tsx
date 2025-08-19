"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#6B8E5A] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-200 border-0 rounded-3xl text-center">
        <CardHeader className="pb-6">
          <div className="text-[#6B8E5A] text-4xl font-bold italic mb-4">Fundflow</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-[#6B8E5A] hover:bg-[#5A7A4A] text-white rounded-full flex-1">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-[#6B8E5A] text-[#6B8E5A] hover:bg-[#6B8E5A] hover:text-white rounded-full flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
