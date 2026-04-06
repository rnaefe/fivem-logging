import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// Proxy search with role-based access:
// - Global admin: her şeyi görür
// - Server admin/mod: ilgili sunucuda her şeyi görür
// - Diğerleri: sadece erişebildiği kanalların event_type/kategori kapsamı
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serverId } = await params

    // Sunucuyu çöz (id veya identifier)
    const serverRow = await query(
      `SELECT id, identifier FROM servers WHERE id = ? OR identifier = ? LIMIT 1`,
      [serverId, serverId]
    )
    if (!serverRow || serverRow.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    const dbServerId = serverRow[0].id
    const serverIdentifier = serverRow[0].identifier
    const { searchParams } = new URL(request.url)

    // Admin bypass
    const isGlobalAdmin = Boolean(user.is_admin)
    const serverAdmin = await query(
      `SELECT permission_level FROM server_admins WHERE server_id = ? AND discord_id = ? AND permission_level IN ('admin','moderator')`,
      [dbServerId, user.discord_id]
    )
    const isServerAdmin = serverAdmin.length > 0
    if (!isGlobalAdmin && !isServerAdmin) {
      // Check if user has basic server access
      const usa = await query(
        `SELECT 1 FROM user_server_access WHERE user_id = ? AND server_id = ?`,
        [user.id, dbServerId]
      )
      if (!usa || usa.length === 0) {
        return NextResponse.json({ error: 'No access to server' }, { status: 403 })
      }
    }

    // Backend query paramları
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const paramsOut = new URLSearchParams()
    for (const [key, val] of searchParams.entries()) {
      paramsOut.append(key, val)
    }
    // server_id'yi ES için identifier olarak zorla
    paramsOut.set('server_id', paramsOut.get('server_id') || serverIdentifier)

    console.log('[Search] proxying to backend', {
      backendUrl,
      params: paramsOut.toString()
    })

    const res = await fetch(`${backendUrl}/search?${paramsOut.toString()}`)
    if (!res.ok) {
      return NextResponse.json({ error: 'Backend search failed' }, { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy search error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

