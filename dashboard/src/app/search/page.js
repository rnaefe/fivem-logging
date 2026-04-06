"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogTable } from "@/components/log-table"
import { Skeleton } from "@/components/ui/skeleton"
import { searchLogs } from "@/lib/api"
import { Search, Filter, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/useAuth"

export default function SearchPage() {
  const { currentServer, servers, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([{ value: "", label: "All Categories" }])
  const [eventTypes, setEventTypes] = useState([{ value: "", label: "All Event Types" }])
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    event_type: '',
    license: '',
    player_name: '',
    server_name: '',
    isDevServer: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  })
  const [total, setTotal] = useState(0)
  const [activeFilters, setActiveFilters] = useState([])

  useEffect(() => {
    updateActiveFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    async function loadMeta() {
      try {
        let res = await fetch('/api/meta/list')
        let data = await res.json()

        // If either list is empty, trigger sync then refetch
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
        // ignore, fallback to static
      }
    }
    loadMeta()
  }, [])

  const updateActiveFilters = () => {
    const active = []
    if (filters.q) active.push({ key: 'q', label: 'Search', value: filters.q })
    if (filters.category) active.push({ key: 'category', label: 'Category', value: filters.category })
    if (filters.event_type) active.push({ key: 'event_type', label: 'Event Type', value: filters.event_type })
    if (filters.license) active.push({ key: 'license', label: 'License', value: filters.license })
    if (filters.player_name) active.push({ key: 'player_name', label: 'Player', value: filters.player_name })
    if (filters.server_name) active.push({ key: 'server_name', label: 'Server', value: filters.server_name })
    if (filters.isDevServer) active.push({ key: 'isDevServer', label: 'Environment', value: filters.isDevServer === 'true' ? 'Dev' : 'Prod' })
    if (filters.date_from) active.push({ key: 'date_from', label: 'From', value: filters.date_from })
    if (filters.date_to) active.push({ key: 'date_to', label: 'To', value: filters.date_to })
    setActiveFilters(active)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const removeFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: '' }))
  }

  const clearAllFilters = () => {
    setFilters({
      q: '',
      category: '',
      event_type: '',
      license: '',
      player_name: '',
      server_name: '',
      isDevServer: '',
      date_from: '',
      date_to: '',
      page: 1,
      limit: 20
    })
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!currentServer) return
    setLoading(true)
    try {
         const data = await searchLogs({
           ...filters,
           server_id: currentServer?.identifier
         })
      setLogs(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Search failed:', error)
      setLogs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // Auto-search when page changes
  useEffect(() => {
    if (filters.page > 1 && currentServer) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, currentServer])

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
          <h2 className="text-3xl font-bold tracking-tight text-white">Advanced Search</h2>
          <p className="text-zinc-400">No servers assigned to your account.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentServer) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Advanced Search</h2>
          <p className="text-zinc-400">Please select a server from the top bar.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Advanced Search</h2>
          <p className="text-zinc-400 mt-1">
            Search and filter logs with powerful query options
          </p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Search Filters
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Use multiple filters to narrow down your search
                </CardDescription>
              </div>
              {activeFilters.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Full-text Search */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">
                  Full-text Search
                </label>
                <Input
                  placeholder="Search in logs..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                />
              </div>

              {/* Category & Event Type */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    Category
                  </label>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-300"
                  >
                    {categories.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    Event Type
                  </label>
                  <Select
                    value={filters.event_type}
                    onChange={(e) => handleFilterChange('event_type', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-300"
                  >
                    {eventTypes.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Player & License */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    Player Name
                  </label>
                  <Input
                    placeholder="Player name..."
                    value={filters.player_name}
                    onChange={(e) => handleFilterChange('player_name', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    License ID
                  </label>
                  <Input
                    placeholder="license:xxx"
                    value={filters.license}
                    onChange={(e) => handleFilterChange('license', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                  />
                </div>
              </div>

              {/* Server & Environment */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">
                    Environment
                  </label>
                  <Select
                    value={filters.isDevServer}
                    onChange={(e) => handleFilterChange('isDevServer', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-300"
                  >
                    <option value="">All Environments</option>
                    <option value="true">Development</option>
                    <option value="false">Production</option>
                  </Select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date From
                  </label>
                  <Input
                    type="datetime-local"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date To
                  </label>
                  <Input
                    type="datetime-local"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-white text-black hover:bg-zinc-200">
                  <Search className="mr-2 h-4 w-4" />
                  Search Logs
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-zinc-400">Active Filters:</span>
                {activeFilters.map((filter) => (
                  <Badge 
                    key={filter.key}
                    variant="secondary"
                    className="gap-2 pr-1"
                  >
                    <span className="text-zinc-400">{filter.label}:</span>
                    <span className="text-zinc-200">{filter.value}</span>
                    <button
                      onClick={() => removeFilter(filter.key)}
                      className="ml-1 hover:bg-zinc-700 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Search Results</CardTitle>
                <CardDescription className="text-zinc-400">
                  {total > 0 ? `Found ${total.toLocaleString('en-US')} logs` : 'No logs found'}
                </CardDescription>
              </div>
              {total > 0 && (
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
                    onClick={() => {
                      setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
                    }}
                    disabled={filters.page >= totalPages}
                    className="border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 bg-zinc-800/50" />
                ))}
              </div>
            ) : logs.length > 0 ? (
              <LogTable logs={logs} />
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No results found. Try adjusting your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
