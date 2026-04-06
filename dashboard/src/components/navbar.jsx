"use client"

import Link from "next/link"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServerSelector } from "@/components/server-selector"
import { UserMenu } from "@/components/user-menu"

export function Navbar() {
  return (
    <div className="relative z-50 border-b border-border backdrop-blur-xl bg-black/50">
      <div className="flex h-16 items-center px-6 gap-4">
        <div className="flex-1 flex items-center gap-4">
          <ServerSelector />
          <Link href="/search" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
            <Search className="h-4 w-4 mr-2" />
            Advanced Search
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-zinc-900">
            <Bell className="h-5 w-5 text-zinc-400" />
          </Button>
          <UserMenu />
        </div>
      </div>
    </div>
  )
}

