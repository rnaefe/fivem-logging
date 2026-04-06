"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogTable } from "@/components/log-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/useAuth"
import { getStats, getTopWeapons, getTopVehicles, getRecentLogs } from "@/lib/api"
import { 
  FileText, 
  Activity, 
  Users, 
  AlertCircle,
  TrendingUp,
  Crosshair,
  Car
} from "lucide-react"

export default function DashboardPage() {
  const { user, currentServer, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [weapons, setWeapons] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentServer])

  async function fetchData() {
    try {
      setLoading(true)
      
      const params = currentServer ? { server_id: currentServer.identifier } : {}
      
      const [statsData, logsData, weaponsData, vehiclesData] = await Promise.all([
        getStats({ days: 7, ...params }),
        getRecentLogs(10, params.server_id),
        getTopWeapons({ days: 7, limit: 5, ...params }),
        getTopVehicles({ days: 7, limit: 5, ...params })
      ])
      
      setStats(statsData)
      setRecentLogs(logsData.items || [])
      setWeapons(weaponsData.weapons || [])
      setVehicles(vehiclesData.vehicles || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 bg-zinc-800/50" />
            ))}
          </div>
          <Skeleton className="h-96 bg-zinc-800/50" />
        </div>
      </DashboardLayout>
    )
  }

  const categoryCount = stats?.byCategory?.length || 0
  const topCategory = stats?.byCategory?.[0]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-zinc-400 mt-1">
            {currentServer ? `${currentServer.name} - Overview` : 'FiveM log management system overview'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Logs"
            value={stats?.total?.toLocaleString('en-US') || '0'}
            description={`Last ${stats?.period || '7 days'}`}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Today"
            value={stats?.today?.toLocaleString('en-US') || '0'}
            description="Records today"
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Unique Players"
            value={stats?.uniquePlayers?.toLocaleString('en-US') || '0'}
            description="Active players"
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Event Types"
            value={stats?.byEventType?.length || 0}
            description={topCategory ? `Top: ${topCategory.category}` : 'No categories'}
            icon={AlertCircle}
            color="yellow"
          />
        </div>

        {/* Top Weapons & Vehicles */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-red-400" />
                Top Weapons (7 Days)
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Most used weapons on the server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8 bg-zinc-800/50" />
                  ))}
                </div>
              ) : weapons.length > 0 ? (
                <div className="space-y-3">
                  {weapons.map((weapon, index) => (
                    <div key={weapon.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500 w-4">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-zinc-300">{weapon.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                          {weapon.total?.toLocaleString()} uses
                        </Badge>
                        {weapon.kills > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            {weapon.kills} kills
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Crosshair className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No weapon data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-400" />
                Top Vehicles (7 Days)
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Most spawned vehicles on the server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8 bg-zinc-800/50" />
                  ))}
                </div>
              ) : vehicles.length > 0 ? (
                <div className="space-y-3">
                  {vehicles.map((vehicle, index) => (
                    <div key={vehicle.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500 w-4">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-zinc-300">{vehicle.name}</span>
                      </div>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        {vehicle.count?.toLocaleString()} spawns
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No vehicle data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4 bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Category Distribution</CardTitle>
              <CardDescription className="text-zinc-400">
                Log distribution by categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byCategory?.map(item => {
                  const percentage = stats.total > 0 ? (item.count / stats.total * 100).toFixed(1) : 0
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize text-zinc-300">{item.category}</span>
                        <span className="text-zinc-500">
                          {item.count.toLocaleString('en-US')} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {!stats?.byCategory?.length && (
                  <p className="text-center text-zinc-500 py-4">No category data</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 bg-zinc-900/50 border-zinc-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Popular Events</CardTitle>
              <CardDescription className="text-zinc-400">
                Most recorded event types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byEventType?.slice(0, 5).map(item => (
                  <div key={item.eventType} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-zinc-300">{item.eventType}</span>
                    </div>
                    <span className="text-sm text-zinc-500 font-mono">
                      {item.count.toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
                {!stats?.byEventType?.length && (
                  <p className="text-center text-zinc-500 py-4">No event data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Recent Logs</CardTitle>
            <CardDescription className="text-zinc-400">
              Most recently recorded log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogTable logs={recentLogs} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
