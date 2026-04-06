"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select as UiSelect } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select } from "@/components/ui/select"
import { useAuth } from "@/lib/useAuth"
import { 
  Server, 
  ArrowLeft, 
  Key, 
  Copy, 
  Check,
  RefreshCw,
  Hash,
  Plus,
  Trash2,
  Save,
  Users,
  Shield,
  Search
} from "lucide-react"

export default function ServerManagePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serverId = params.serverId
  
  const [server, setServer] = useState(null)
  const [channels, setChannels] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newChannel, setNewChannel] = useState({ name: '', slug: '', description: '', eventTypes: '' })
  const [newAdminId, setNewAdminId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userOptions, setUserOptions] = useState([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.isAdmin && serverId) {
      fetchServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverId])

  async function fetchServer() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/servers/${serverId}`)
      if (res.ok) {
        const data = await res.json()
        setServer(data.server)
        setChannels(data.channels || [])
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Failed to fetch server:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveServer() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/servers/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: server.name,
          identifier: server.identifier,
          discordGuildId: server.discord_guild_id,
          isActive: server.is_active
        })
      })
      
      if (res.ok) {
        // Show success feedback
      }
    } catch (error) {
      console.error('Failed to save server:', error)
    } finally {
      setSaving(false)
    }
  }

  async function regenerateApiKey() {
    if (!confirm('Are you sure? The old API key will stop working immediately.')) return
    
    try {
      const res = await fetch(`/api/admin/servers/${serverId}`, { method: 'PATCH' })
      if (res.ok) {
        const data = await res.json()
        setServer({ ...server, api_key: data.apiKey })
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error)
    }
  }

  async function addChannel(e) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/servers/${serverId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannel.name,
          slug: newChannel.slug || newChannel.name.toLowerCase().replace(/\s+/g, '-'),
          description: newChannel.description,
          eventTypes: newChannel.eventTypes.split(',').map(e => e.trim()).filter(Boolean)
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setChannels([...channels, data.channel])
        setNewChannel({ name: '', slug: '', description: '', eventTypes: '' })
        setShowAddChannel(false)
      }
    } catch (error) {
      console.error('Failed to add channel:', error)
    }
  }

  async function deleteChannel(channelId) {
    if (!confirm('Delete this channel?')) return
    
    try {
      const res = await fetch(`/api/servers/${serverId}/channels/${channelId}`, { method: 'DELETE' })
      if (res.ok) {
        setChannels(channels.filter(c => c.id !== channelId))
      }
    } catch (error) {
      console.error('Failed to delete channel:', error)
    }
  }

  async function addAdmin(e) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: newAdminId })
      })
      
      if (res.ok) {
        fetchServer() // Refresh data
        setNewAdminId('')
        setUserSearch('')
        setUserOptions([])
        setShowAddAdmin(false)
      }
    } catch (error) {
      console.error('Failed to add admin:', error)
    }
  }

  async function updateAdminPermission(discordId, permissionLevel) {
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/admins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId, permissionLevel })
      })
      if (res.ok) {
        // Update local state
        setAdmins(prev => prev.map(a => 
          a.discord_id === discordId ? { ...a, permission_level: permissionLevel } : a
        ))
      }
    } catch (error) {
      console.error('Failed to update admin permission:', error)
    }
  }

  function copyApiKey() {
    navigator.clipboard.writeText(server.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-zinc-800/50" />
          <Skeleton className="h-64 bg-zinc-800/50" />
        </div>
      </DashboardLayout>
    )
  }

  if (!server) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-zinc-400">Server not found</p>
          <Link href="/admin">
            <Button className="mt-4">Back to Admin</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="border-zinc-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{server.name}</h2>
            <p className="text-zinc-400">{server.identifier}</p>
          </div>
        </div>

        {/* Server Settings */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-400" />
              Server Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Server Name</label>
                <Input
                  value={server.name}
                  onChange={e => setServer({ ...server, name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Identifier</label>
                <Input
                  value={server.identifier}
                  onChange={e => setServer({ ...server, identifier: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Discord Guild ID (zorunlu)</label>
                <Input
                  value={server.discord_guild_id || ''}
                  onChange={e => setServer({ ...server, discord_guild_id: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Status</label>
                <Button
                  variant="outline"
                  onClick={() => setServer({ ...server, is_active: !server.is_active })}
                  className={`w-full justify-start ${server.is_active ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}
                >
                  {server.is_active ? '● Active' : '○ Inactive'}
                </Button>
              </div>
            </div>
            <Button onClick={saveServer} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* API Key */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              API Key
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Use this in your FiveM server.cfg: <code className="bg-zinc-800 px-1 rounded">set logs_api_key &quot;{server.api_key?.slice(0, 15)}...&quot;</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={server.api_key}
                readOnly
                className="bg-zinc-800 border-zinc-700 font-mono text-sm"
              />
              <Button variant="outline" onClick={copyApiKey} className="border-zinc-700">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={regenerateApiKey} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log Channels */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Hash className="h-5 w-5 text-purple-400" />
                  Log Channels
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Organize logs by event type
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddChannel(!showAddChannel)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddChannel && (
              <form onSubmit={addChannel} className="mb-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Channel Name"
                    value={newChannel.name}
                    onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                    className="bg-zinc-900 border-zinc-700"
                    required
                  />
                  <Input
                    placeholder="Slug (auto-generated if empty)"
                    value={newChannel.slug}
                    onChange={e => setNewChannel({ ...newChannel, slug: e.target.value })}
                    className="bg-zinc-900 border-zinc-700"
                  />
                  <Input
                    placeholder="Description"
                    value={newChannel.description}
                    onChange={e => setNewChannel({ ...newChannel, description: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 md:col-span-2"
                  />
                  <Input
                    placeholder="Event types (comma separated): player_joining, player_dropped"
                    value={newChannel.eventTypes}
                    onChange={e => setNewChannel({ ...newChannel, eventTypes: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 md:col-span-2"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Create</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddChannel(false)}>Cancel</Button>
                </div>
              </form>
            )}
            
            {channels.length > 0 ? (
              <div className="space-y-2">
                {channels.map(channel => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color || '#6366f1' }} />
                      <div>
                        <span className="font-medium text-white">{channel.name}</span>
                        <p className="text-xs text-zinc-500">#{channel.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {JSON.parse(channel.event_types || '[]').slice(0, 2).map(type => (
                          <Badge key={type} variant="outline" className="text-xs border-zinc-700">{type}</Badge>
                        ))}
                        {JSON.parse(channel.event_types || '[]').length > 2 && (
                          <Badge variant="outline" className="text-xs border-zinc-700">+{JSON.parse(channel.event_types).length - 2}</Badge>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-zinc-500">No channels yet</p>
            )}
          </CardContent>
        </Card>

        {/* Server Admins */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  Server Admins
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Discord users who can manage this server
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddAdmin(!showAddAdmin)} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddAdmin && (
              <form onSubmit={addAdmin} className="mb-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search by username or Discord ID"
                      value={userSearch}
                      onChange={async (e) => {
                        const val = e.target.value
                        setUserSearch(val)
                        setNewAdminId(val)
                        if (val.length < 2) {
                          setUserOptions([])
                          return
                        }
                        setUserSearchLoading(true)
                        try {
                          const res = await fetch(`/api/admin/users?q=${encodeURIComponent(val)}`)
                          const data = await res.json()
                          setUserOptions(data.users || [])
                        } catch (err) {
                          setUserOptions([])
                        } finally {
                          setUserSearchLoading(false)
                        }
                      }}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter at least 2 characters')}
                      onInput={(e) => e.target.setCustomValidity('')}
                      className="bg-zinc-900 border-zinc-700"
                      required
                    />
                    {userSearchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">...</div>
                    )}
                    {userOptions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg max-h-48 overflow-y-auto">
                        {userOptions.map(opt => (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => {
                              setNewAdminId(opt.discord_id)
                              setUserSearch(`${opt.discord_username} (${opt.discord_id})`)
                              setUserOptions([])
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-zinc-800"
                          >
                            <div className="text-sm text-white">{opt.discord_username}</div>
                            <div className="text-xs text-zinc-500">{opt.discord_id}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Add</Button>
                  <Button type="button" variant="outline" onClick={() => {setShowAddAdmin(false); setUserSearch(''); setUserOptions([]);}}>Cancel</Button>
                </div>
                <p className="text-xs text-zinc-500">Selected user will be added by Discord ID. You can search with at least 2 characters.</p>
              </form>
            )}
            
            {admins.length > 0 ? (
              <div className="space-y-2">
                {admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-3">
                      {admin.discord_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={`https://cdn.discordapp.com/avatars/${admin.discord_id}/${admin.discord_avatar}.png`}
                          className="w-8 h-8 rounded-full"
                          alt=""
                        />
                      ) : (
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-zinc-400" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-white">{admin.discord_username || 'Unknown'}</span>
                        <p className="text-xs text-zinc-500">{admin.discord_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={admin.permission_level}
                        onChange={(e) => updateAdminPermission(admin.discord_id, e.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-300 text-xs"
                      >
                        <option value="viewer">viewer</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </Select>
                      <Badge className={
                        admin.permission_level === 'admin' ? 'bg-red-500/20 text-red-400' :
                        admin.permission_level === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-700'
                      }>
                        {admin.permission_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-zinc-500">No server admins yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

