export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function resolveAllowedServer(user, serverId) {
  const serverRows = await query(
    `SELECT id, identifier FROM servers WHERE id = ? OR identifier = ? LIMIT 1`,
    [serverId, serverId]
  )
  const server = serverRows[0]
  if (!server) return { error: 'Server not found', status: 404 }

  const isGlobalAdmin = Boolean(user.is_admin)
  const serverAdmin = await query(
    `SELECT 1 FROM server_admins WHERE server_id = ? AND discord_id = ? AND permission_level IN ('admin','moderator')`,
    [server.id, user.discord_id]
  )

  if (!isGlobalAdmin && serverAdmin.length === 0) {
    const access = await query(
      `SELECT 1 FROM user_server_access WHERE user_id = ? AND server_id = ?`,
      [user.id, server.id]
    )
    if (access.length === 0) return { error: 'No access to server', status: 403 }
  }

  return { server }
}

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serverId } = await params
    const resolved = await resolveAllowedServer(user, serverId)
    if (resolved.error) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }

    const { searchParams } = new URL(request.url)
    const kind = searchParams.get('kind')
    const endpoint = kind === 'weapons'
      ? '/stats/weapons'
      : kind === 'vehicles'
        ? '/stats/vehicles'
        : '/stats'

    const paramsOut = new URLSearchParams()
    if (searchParams.get('days')) paramsOut.set('days', searchParams.get('days'))
    if (searchParams.get('limit')) paramsOut.set('limit', searchParams.get('limit'))
    paramsOut.set('server_id', resolved.server.identifier)

    const res = await fetch(`${backendUrl}${endpoint}?${paramsOut.toString()}`, {
      headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || '' },
      cache: 'no-store'
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Backend stats failed' }, { status: res.status })
    }

    return NextResponse.json(await res.json())
  } catch (error) {
    console.error('Proxy stats error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
