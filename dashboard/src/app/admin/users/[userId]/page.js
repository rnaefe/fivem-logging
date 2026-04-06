"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/useAuth"
import { ArrowLeft, Shield, Users, Server, ToggleLeft, ToggleRight } from "lucide-react"

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState(null)
  const [access, setAccess] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const userId = params.userId

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchUser() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) {
        setUser(null)
        setAccess([])
        return
      }
      const data = await res.json()
      setUser(data.user)
      setAccess(data.serverAccess || [])
    } catch (error) {
      console.error("Failed to load user:", error)
      setUser(null)
      setAccess([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleAdmin() {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: user.is_admin ? 0 : 1 })
      })
      if (res.ok) {
        setUser(prev => ({ ...prev, is_admin: prev.is_admin ? 0 : 1 }))
      }
    } catch (error) {
      console.error("Failed to update admin:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-zinc-800/50" />
          <Skeleton className="h-64 bg-zinc-800/50" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-zinc-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-center text-zinc-500">User not found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="hover:bg-zinc-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{user.discord_username}</h2>
            <p className="text-zinc-400 text-sm">Discord ID: {user.discord_id}</p>
          </div>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            onClick={toggleAdmin}
            disabled={saving || currentUser?.id === user.id}
            className={user.is_admin ? "border-red-500/50 text-red-400" : "border-zinc-700 text-zinc-200"}
          >
            {user.is_admin ? (
              <><ToggleRight className="h-4 w-4 mr-2" /> Remove Admin</>
            ) : (
              <><ToggleLeft className="h-4 w-4 mr-2" /> Make Admin</>
            )}
          </Button>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              User Profile
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Discord account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={user.discord_avatar 
                  ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png`
                  : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discord_id) % 5}.png`
                }
                alt={user.discord_username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="text-sm text-zinc-300">Username: {user.discord_username}</p>
                <p className="text-sm text-zinc-500">Email: {user.discord_email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={user.is_admin ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-zinc-800 text-zinc-300 border-zinc-700"}>
                {user.is_admin ? "Admin" : "User"}
              </Badge>
              <span className="text-xs text-zinc-500">Last login: {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-400" />
              Server Access
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Servers this user can access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {access.length > 0 ? (
              <div className="space-y-2">
                {access.map(acc => (
                  <div key={acc.server_id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
                    <div>
                      <p className="text-sm text-white">{acc.server_name}</p>
                      <p className="text-xs text-zinc-500">{acc.identifier}</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Viewer</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No server access</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

