"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"

const categoryColors = {
  player: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  inventory: "bg-green-500/10 text-green-500 border-green-500/20",
  txadmin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  resource: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  chat: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  combat: "bg-red-500/10 text-red-500 border-red-500/20",
  vehicle: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  legacy: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  test: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export function LogTable({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No logs found
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400 text-xs uppercase tracking-wider">
              Time
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400 text-xs uppercase tracking-wider">
              Event
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400 text-xs uppercase tracking-wider">
              Category
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400 text-xs uppercase tracking-wider">
              Player
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400 text-xs uppercase tracking-wider">
              Server
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log._id}
              className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/30"
            >
              <td className="p-4 align-middle">
                <div className="text-sm text-zinc-300">
                  {formatRelativeTime(log._source['@timestamp'])}
                </div>
              </td>
              <td className="p-4 align-middle">
                <Link 
                  href={`/logs/${log._id}`}
                  className="text-sm font-medium text-zinc-100 hover:text-white hover:underline transition-colors"
                >
                  {log._source.event_type}
                </Link>
              </td>
              <td className="p-4 align-middle">
                <Badge 
                  variant="outline"
                  className={categoryColors[log._source.category] || categoryColors.test}
                >
                  {log._source.category}
                </Badge>
              </td>
              <td className="p-4 align-middle">
                <div className="text-sm text-zinc-300">
                  {log._source.player?.name || '-'}
                </div>
                {log._source.player?.id && (
                  <div className="text-xs text-zinc-500">
                    ID: {log._source.player.id}
                  </div>
                )}
              </td>
              <td className="p-4 align-middle">
                <div className="text-sm text-zinc-300">{log._source.server?.name || '-'}</div>
                {log._source.isDevServer && (
                  <Badge variant="outline" className="mt-1 border-amber-500/30 text-amber-500">DEV</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

