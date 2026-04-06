"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FileText, 
  Activity,
  Settings,
  Search,
  Hash,
  Shield,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/useAuth"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500"
  },
  {
    label: "Log Channels",
    icon: Hash,
    href: "/channels",
    color: "text-violet-500"
  },
  {
    label: "All Logs",
    icon: FileText,
    href: "/logs",
    color: "text-emerald-500"
  },
  {
    label: "Advanced Search",
    icon: Search,
    href: "/search",
    color: "text-orange-500"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500"
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-black border-r border-border text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-10">
          <div className="relative w-8 h-8 mr-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-lg"></div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            FiveM Logs
          </h1>
        </Link>
        
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-500"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
          
          {/* Admin Link - Only show if user is admin */}
          {user?.isAdmin === true && (
            <Link
              href="/admin"
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200",
                pathname.startsWith("/admin") ? "text-white bg-white/10" : "text-zinc-500"
              )}
            >
              <div className="flex items-center flex-1">
                <Shield className="h-5 w-5 mr-3 text-red-500" />
                Admin Panel
              </div>
            </Link>
          )}
        </div>
      </div>
      
      {/* User Info */}
      {user && (
        <div className="px-3 py-2 border-t border-zinc-800">
          <div className="flex items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId || '0') % 5}.png`
              }
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              {user.isAdmin === true && (
                <p className="text-xs text-red-400">Admin</p>
              )}
            </div>
            <button 
              onClick={logout}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="px-3 py-2">
        <BackendStatus />
      </div>
    </div>
  )
}

function BackendStatus() {
  const [status, setStatus] = useState({ online: false, checking: true })

  useEffect(() => {
    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function checkBackendStatus() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { method: 'GET' })
      setStatus({ online: res.ok, checking: false })
    } catch {
      setStatus({ online: false, checking: false })
    }
  }

  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <p className="text-xs text-zinc-500 mb-2">System Status</p>
      <div className="flex items-center">
        <div className={cn(
          "w-2 h-2 rounded-full mr-2",
          status.checking ? "bg-yellow-500 animate-pulse" :
          status.online ? "bg-emerald-500 animate-pulse" : "bg-red-500"
        )}></div>
        <span className="text-sm font-medium text-zinc-300">
          {status.checking ? "Checking..." : status.online ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  )
}

