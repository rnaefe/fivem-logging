"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogTable } from "@/components/log-table"
import { Skeleton } from "@/components/ui/skeleton"
import { searchLogs } from "@/lib/api"
import { useAuth } from "@/lib/useAuth"
import { Search, ChevronLeft, ChevronRight, X, Hash } from "lucide-react"

function LogsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, currentServer, servers, loading: authLoading } = useAuth()
  
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState(null)
  const [categories, setCategories] = useState([{ value: "", label: "All Categories" }])
  const [eventTypes, setEventTypes] = useState([{ value: "", label: "All Event Types" }])
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    event_type: '',
    license: '',
    page: 1,
    limit: 20
  })
  const [total, setTotal] = useState(0)

  // Check for channel filter from URL
  useEffect(() => {
    const channelSlug = searchParams.get('channel')
    if (channelSlug && currentServer) {
      fetchChannelInfo(channelSlug)
    } else {
      setChannel(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentServer])

  useEffect(() => {
    async function loadMeta() {
      try {
        let res = await fetch('/api/meta/list')
        let data = await res.json()

        // If either list is empty, try to sync then fetch again
        if ((!data.categories || data.categories.length === 0) || (!data.eventTypes || data.eventTypes.length === 0)) {
          await fetch('/api/meta/sync')
          res = await fetch('/api/meta/list')
          data = await res.json()
        }

        if (data.categories?.length) {
          setCategories([{ value: "", label: "All Categories" }, ...data.categories.map(c => ({ value: c, label: c }))])
        }
        if (data.eventTypes?.length) {
          setEventTypes([{ value: "", label: "All Event Types" }, ...data.eventTypes.map(e => ({ value: e, label: e }))])
        }
      } catch (err) {
        // ignore, fall back to static
      }
    }
    loadMeta()
  }, [])

  async function fetchChannelInfo(slug) {
    if (!currentServer) return
    try {
      const res = await fetch(`/api/servers/${currentServer.id}/channels`)
      const data = await res.json()
      const foundChannel = data.channels?.find(c => c.slug === slug)
      if (foundChannel) {
        setChannel(foundChannel)
        // Filter by channel's event types
        // This will be done in useEffect below
      }
    } catch (error) {
      console.error('Failed to fetch channel:', error)
    }
  }

  useEffect(() => {
    async function fetchLogs() {
      if (!currentServer) return
      setLoading(true)
      try {
        // If channel is set, override filters with channel's event types
        let searchFilters = { ...filters, server_id: currentServer.identifier }
        if (channel && channel.eventTypes?.length > 0) {
          // For now pick first event type; could be expanded to multi
          searchFilters.event_type = channel.eventTypes[0]
        }
        
        const data = await searchLogs(searchFilters)
        setLogs(data.items || [])
        setTotal(data.total || 0)
      } catch (error) {
        console.error('Failed to load logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filters, channel, currentServer])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const totalPages = Math.ceil(total / filters.limit)

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-zinc-800/50" />
          <Skeleton className="h-96 bg-zinc-800/50" />
        </div>
      </DashboardLayout>
    )
  }

  if (!servers || servers.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">All Logs</h2>
          <p className="text-zinc-400">No servers assigned to your account.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentServer) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">All Logs</h2>
          <p className="text-zinc-400">Please select a server from the top bar.</p>
        </div>
      </DashboardLayout>
    )
  }

  const clearChannel = () => {
    router.push('/logs')
    setChannel(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {channel ? channel.name : 'All Logs'}
            </h2>
            <p className="text-zinc-400 mt-1">
              {channel 
                ? `Viewing logs in #${channel.slug}` 
                : 'View and filter all system logs'
              }
            </p>
          </div>
          {channel && (
            <Button 
              variant="outline" 
              onClick={clearChannel}
              className="border-zinc-800 hover:bg-zinc-800"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Channel Filter
            </Button>
          )}
        </div>

        {channel && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-zinc-500" />
                <div>
                  <span className="text-zinc-300 font-medium">{channel.name}</span>
                  <span className="text-zinc-500 mx-2">•</span>
                  <span className="text-zinc-500 text-sm">{channel.description}</span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {channel.eventTypes?.slice(0, 3).map(type => (
                    <Badge key={type} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                      {type}
                    </Badge>
                  ))}
                  {channel.eventTypes?.length > 3 && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                      +{channel.eventTypes.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Quick Filters</CardTitle>
            <CardDescription className="text-zinc-400">
              Use these options for quick filtering. For advanced options, use <a href="/search" className="text-blue-400 hover:underline">Advanced Search</a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                />
              </div>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300"
              >
                {categories.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Select
                value={filters.event_type}
                onChange={(e) => handleFilterChange('event_type', e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300"
              >
                {eventTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Button type="submit" className="bg-white text-black hover:bg-zinc-200">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Log List</CardTitle>
                <CardDescription className="text-zinc-400">
                  Found {total.toLocaleString('en-US')} logs
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={filters.page === 1}
                  className="border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-zinc-400">
                  Page {filters.page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={filters.page >= totalPages}
                  className="border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <LogTable logs={logs} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function LogsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <LogsContent />
    </Suspense>
  )
}
