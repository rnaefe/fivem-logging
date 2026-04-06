"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/useAuth"
import { 
  Server, 
  Users, 
  Shield, 
  Plus, 
  Settings, 
  Trash2,
  Copy,
  Check,
  ExternalLink
} from "lucide-react"

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [servers, setServers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [newServer, setNewServer] = useState({ name: '', identifier: '', discordGuildId: '' })
  const [creating, setCreating] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user && user.isAdmin !== true) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.isAdmin === true) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    setLoading(true)
    try {
      const [serversRes, usersRes] = await Promise.all([
        fetch('/api/admin/servers'),
        fetch('/api/admin/users')
      ])
      
      if (serversRes.ok) {
        const data = await serversRes.json()
        setServers(data.servers || [])
      }
      
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createServer(e) {
    e.preventDefault()
    setCreating(true)
    
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServer)
      })
      
      if (res.ok) {
        const data = await res.json()
        setServers([...servers, data])
        setNewServer({ name: '', identifier: '', discordGuildId: '' })
        setShowCreateServer(false)
      }
    } catch (error) {
      console.error('Failed to create server:', error)
    } finally {
      setCreating(false)
    }
  }

  async function deleteServer(serverId) {
    if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      return
    }
    
    try {
      const res = await fetch(`/api/admin/servers/${serverId}`, { method: 'DELETE' })
      if (res.ok) {
        setServers(servers.filter(s => s.id !== serverId))
      }
    } catch (error) {
      console.error('Failed to delete server:', error)
    }
  }

  function copyApiKey(key) {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (authLoading || user?.isAdmin !== true) {
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Admin Panel</h2>
            <p className="text-zinc-400 mt-1">
              Manage servers and users
            </p>
          </div>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Admin Only
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Server className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{servers.length}</p>
                  <p className="text-sm text-zinc-400">Total Servers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                  <p className="text-sm text-zinc-400">Registered Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{users.filter(u => Boolean(u.is_admin)).length}</p>
                  <p className="text-sm text-zinc-400">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servers */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-400" />
                  Servers
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Manage FiveM server connections
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateServer(!showCreateServer)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCreateServer && (
              <form onSubmit={createServer} className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="text-sm font-medium text-white mb-4">Create New Server</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    placeholder="Server Name"
                    value={newServer.name}
                    onChange={e => setNewServer({ ...newServer, name: e.target.value })}
                    className="bg-zinc-900 border-zinc-700"
                    required
                  />
                  <Input
                    placeholder="Identifier (e.g., my-server)"
                    value={newServer.identifier}
                    onChange={e => setNewServer({ ...newServer, identifier: e.target.value })}
                    className="bg-zinc-900 border-zinc-700"
                    required
                  />
                  <Input
                    placeholder="Discord Guild ID (zorunlu)"
                    value={newServer.discordGuildId}
                    onChange={e => setNewServer({ ...newServer, discordGuildId: e.target.value })}
                    className="bg-zinc-900 border-zinc-700"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700">
                    {creating ? 'Creating...' : 'Create Server'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateServer(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 bg-zinc-800/50" />
                ))}
              </div>
            ) : servers.length > 0 ? (
              <div className="space-y-3">
                {servers.map(server => (
                  <div 
                    key={server.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${server.is_active ? 'bg-green-400' : 'bg-zinc-500'}`} />
                      <div>
                        <h4 className="font-medium text-white">{server.name}</h4>
                        <p className="text-sm text-zinc-500">{server.identifier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded text-xs font-mono text-zinc-400">
                        <span>{server.api_key?.slice(0, 20)}...</span>
                        <button 
                          onClick={() => copyApiKey(server.api_key)}
                          className="p-1 hover:text-white"
                        >
                          {copiedKey === server.api_key ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <Link href={`/admin/servers/${server.id}`}>
                        <Button variant="outline" size="sm" className="border-zinc-700">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteServer(server.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No servers yet. Create your first server above.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Users
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Users who have logged in via Discord
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 bg-zinc-800/50" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map(u => (
                  <div 
                    key={u.id}
                    className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={u.discord_avatar 
                          ? `https://cdn.discordapp.com/avatars/${u.discord_id}/${u.discord_avatar}.png`
                          : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discord_id) % 5}.png`
                        }
                        alt={u.discord_username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{u.discord_username}</span>
                          {Boolean(u.is_admin) && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">ID: {u.discord_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        Last login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                      </span>
                      <Link href={`/admin/users/${u.id}`}>
                        <Button variant="outline" size="sm" className="border-zinc-700">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No users yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

