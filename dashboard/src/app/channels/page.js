"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/useAuth"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Hash, Plus, Users, MessageSquare, Package, Shield, Server as ServerIcon, 
  FileText, Settings, Eye, Search as SearchIcon, Download
} from "lucide-react"

const iconMap = {
  'users': Users,
  'message-square': MessageSquare,
  'package': Package,
  'shield': Shield,
  'server': ServerIcon,
  'file-text': FileText
}

export default function ChannelsPage() {
  const { user, currentServer, servers, loading: authLoading } = useAuth()
  const router = useRouter()
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState(null)
  const [canCreateChannel, setCanCreateChannel] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (currentServer) {
      fetchChannels()
      checkPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentServer, user])

  async function fetchChannels() {
    if (!currentServer) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/channels`)
      const data = await res.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkPermissions() {
    if (!currentServer || !user) return
    
    // Global admin can always create
    if (user.isAdmin === true) {
      setCanCreateChannel(true)
      return
    }
    
    // Check if server admin
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/permissions`)
      const data = await res.json()
      setCanCreateChannel(data.canManageChannels || false)
    } catch {
      setCanCreateChannel(false)
    }
  }

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-zinc-800/50" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 bg-zinc-800/50" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!servers || servers.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Log Channels</h2>
          <p className="text-zinc-400">No servers assigned to your account.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentServer) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Log Channels</h2>
          <p className="text-zinc-400">Please select a server from the top bar.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Log Channels</h2>
            <p className="text-zinc-400 mt-1">
              Organize and filter logs by channels
            </p>
          </div>
          {canCreateChannel && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-black hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 bg-zinc-800/50" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Hash className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No channels configured yet</p>
                {canCreateChannel && (
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Create your first channel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map(channel => {
              const IconComponent = iconMap[channel.icon] || FileText
              return (
                <Card 
                  key={channel.id} 
                  className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                  onClick={() => router.push(`/logs?channel=${channel.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${channel.color}20` }}
                      >
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: channel.color }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{channel.name}</CardTitle>
                        <CardDescription className="text-zinc-500 text-sm">
                          #{channel.slug}
                        </CardDescription>
                      </div>
                      {canCreateChannel && (
                        <div className="ml-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs border-zinc-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingChannel(channel)
                              setShowEditModal(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 text-sm mb-4">{channel.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {channel.eventTypes?.slice(0, 3).map(type => (
                        <Badge 
                          key={type} 
                          variant="outline" 
                          className="text-xs border-zinc-700 text-zinc-400"
                        >
                          {type}
                        </Badge>
                      ))}
                      {channel.eventTypes?.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs border-zinc-700 text-zinc-400"
                        >
                          +{channel.eventTypes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Channel Modal */}
        {showCreateModal && (
          <CreateChannelModal 
            serverId={currentServer?.id}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false)
              fetchChannels()
            }}
          />
        )}

        {showEditModal && editingChannel && (
          <EditChannelModal
            serverId={currentServer?.id}
            channel={editingChannel}
            onClose={() => { setShowEditModal(false); setEditingChannel(null) }}
            onUpdated={() => {
              setShowEditModal(false)
              setEditingChannel(null)
              fetchChannels()
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

function CreateChannelModal({ serverId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [eventOptions, setEventOptions] = useState([])
  const [eventLoading, setEventLoading] = useState(true)

  // Fetch dynamic event types from backend-synced MySQL
  useEffect(() => {
    async function loadEventTypes() {
      try {
        const res = await fetch('/api/meta/list')
        if (!res.ok) throw new Error('Failed to load meta terms')
        const data = await res.json()
        // data.eventTypes can be array of strings or {value,label}
        const types = (data.eventTypes || []).map(e => (typeof e === 'string' ? e : e.value)).filter(Boolean)
        setEventOptions(types)
      } catch (err) {
        console.error('Failed to load event types:', err)
        setEventOptions([])
      } finally {
        setEventLoading(false)
      }
    }
    loadEventTypes()
  }, [])



  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/servers/${serverId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description,
          eventTypes: selectedEvents
        })
      })
      
      if (res.ok) {
        onCreated()
      }
    } catch (error) {
      console.error('Failed to create channel:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg mx-4 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Create Log Channel</CardTitle>
          <CardDescription className="text-zinc-400">
            Create a new channel to organize your logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">
                Channel Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Admin Actions"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">
                Slug (URL identifier)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. admin-actions"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What logs go in this channel?"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">
                Event Types
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-800/50 rounded-lg">
                {eventLoading && (
                  <span className="text-xs text-zinc-500">Loading event types...</span>
                )}
                {!eventLoading && eventOptions.length === 0 && (
                  <span className="text-xs text-zinc-500">No event types found.</span>
                )}
                {!eventLoading && eventOptions.length > 0 && eventOptions.map(type => (
                  <Badge
                    key={type}
                    variant={selectedEvents.includes(type) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedEvents.includes(type) 
                        ? 'bg-blue-500 text-white' 
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                    onClick={() => {
                      setSelectedEvents(prev => 
                        prev.includes(type)
                          ? prev.filter(t => t !== type)
                          : [...prev, type]
                      )
                    }}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>


            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name || selectedEvents.length === 0}>
                {loading ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function EditChannelModal({ serverId, channel, onClose, onUpdated }) {
  const [name, setName] = useState(channel.name || '')
  const [slug, setSlug] = useState(channel.slug || '')
  const [description, setDescription] = useState(channel.description || '')
  const [selectedEvents, setSelectedEvents] = useState(channel.eventTypes || [])
  const [loading, setLoading] = useState(false)
  const [eventOptions, setEventOptions] = useState([])
  const [eventLoading, setEventLoading] = useState(true)

  useEffect(() => {
    async function loadEventTypes() {
      try {
        const res = await fetch('/api/meta/list')
        if (!res.ok) throw new Error('Failed to load meta terms')
        const data = await res.json()
        const types = (data.eventTypes || []).map(e => (typeof e === 'string' ? e : e.value)).filter(Boolean)
        setEventOptions(types)
      } catch (err) {
        console.error('Failed to load event types:', err)
      } finally {
        setEventLoading(false)
      }
    }
    loadEventTypes()
  }, [])



  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/channels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: channel.id,
          name,
          slug,
          description,
          eventTypes: selectedEvents,
          color: channel.color,
          icon: channel.icon
        })
      })
      if (!res.ok) throw new Error('Failed to update channel')
      onUpdated()
    } catch (err) {
      console.error('Update channel failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit Channel</h3>
            <p className="text-sm text-zinc-500">Update channel settings</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white">Close</Button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Slug</label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">Description</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-zinc-900 border-zinc-800" />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Event Types</label>
            {eventLoading ? (
              <p className="text-xs text-zinc-500">Loading event types...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {eventOptions.map(ev => (
                  <Badge
                    key={ev}
                    variant={selectedEvents.includes(ev) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedEvents.includes(ev)) {
                        setSelectedEvents(selectedEvents.filter(e => e !== ev))
                      } else {
                        setSelectedEvents([...selectedEvents, ev])
                      }
                    }}
                  >
                    {ev}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-zinc-200">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

