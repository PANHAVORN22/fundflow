"use client"

import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function PublicHeader() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-[#6B8E5A] text-3xl font-bold italic">
            Fundflow
          </Link>
        </div>

        <Button asChild variant="ghost" size="sm" className="flex items-center space-x-2">
          <Link href="/auth">
            <User className="w-4 h-4" />
            <span>Sign in</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
