"use client"

import { useAuth } from '@/lib/useAuth'
import { Select } from '@/components/ui/select'
import { Server, AlertCircle } from 'lucide-react'

export function ServerSelector() {
  const { servers, currentServer, selectServer, loading } = useAuth()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-500 text-sm">
        <Server className="h-4 w-4 animate-pulse" />
        Loading servers...
      </div>
    )
  }

  // No servers assigned
  if (!servers || servers.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/30 border border-amber-700/60 rounded-lg text-amber-200 text-sm">
        <AlertCircle className="h-4 w-4" />
        No servers assigned
      </div>
    )
  }

  // Single server: show static pill
  if (servers.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <Server className="h-4 w-4 text-zinc-400" />
        <span className="text-sm text-zinc-300">{servers[0].name}</span>
      </div>
    )
  }

  // Multiple servers: dropdown
  return (
    <div className="flex items-center gap-2">
      <Server className="h-4 w-4 text-zinc-400" />
      <Select
        value={currentServer?.id?.toString() || ''}
        onChange={(e) => {
          const server = servers.find(s => s.id === parseInt(e.target.value))
          if (server) selectServer(server)
        }}
        className="bg-zinc-900/50 border-zinc-800 text-zinc-300 text-sm"
      >
        <option value="" disabled>Select a server</option>
        {servers.map(server => (
          <option key={server.id} value={server.id}>
            {server.name}
          </option>
        ))}
      </Select>
    </div>
  )
}

