"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/useAuth"
import { Settings, Server, Shield, Users, Key, Copy, Check } from "lucide-react"

export default function SettingsPage() {
  const { user, currentServer, servers, loading: authLoading } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const copyApiKey = () => {
    // In real implementation, you'd fetch the actual API key
    navigator.clipboard.writeText('fivem_xxx-xxx-xxx')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-zinc-800/50" />
          <Skeleton className="h-64 bg-zinc-800/50" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
          <p className="text-zinc-400 mt-1">
            Manage your account and server settings
          </p>
        </div>

        {/* User Profile */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Your Profile
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your Discord account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={user.avatar 
                  ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
                  : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
                }
                alt={user.username}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h3 className="text-lg font-medium text-white">{user.username}</h3>
                <p className="text-sm text-zinc-500">Discord ID: {user.discordId}</p>
                {user.isAdmin === true && (
                  <Badge className="mt-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-400" />
              Server Access
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Servers you have access to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servers.map(server => (
                <div 
                  key={server.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    currentServer?.id === server.id 
                      ? 'border-blue-500/50 bg-blue-500/10' 
                      : 'border-zinc-800 bg-zinc-900/50'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-medium text-white">{server.name}</h4>
                    <p className="text-xs text-zinc-500">{server.identifier}</p>
                  </div>
                  {currentServer?.id === server.id && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Active
                    </Badge>
                  )}
                </div>
              ))}
              {servers.length === 0 && (
                <p className="text-center py-4 text-zinc-500">
                  No servers available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
