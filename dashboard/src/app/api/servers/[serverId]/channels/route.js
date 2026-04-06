import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// Get channels for a server
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    
    // Resolve server (supports numeric id or identifier)
    const serverRow = await query(
      `SELECT id FROM servers WHERE id = ? OR identifier = ? LIMIT 1`,
      [serverId, serverId]
    )
    if (!serverRow || serverRow.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    const dbServerId = serverRow[0].id
    
    // Get all channels for this server
    const allChannels = await query(
      'SELECT * FROM log_channels WHERE server_id = ? AND is_active = TRUE ORDER BY name',
      [dbServerId]
    )

    // Check server access
    const isGlobalAdmin = Boolean(user.is_admin)
    let isServerAdmin = false
    if (!isGlobalAdmin) {
      const adminRecord = await queryOne(
        `SELECT 1 FROM server_admins WHERE server_id = ? AND discord_id = ? AND permission_level IN ('admin','moderator')`,
        [dbServerId, user.discord_id]
      )
      isServerAdmin = !!adminRecord
    }

    if (!isGlobalAdmin && !isServerAdmin) {
      const usa = await queryOne(
        `SELECT 1 FROM user_server_access WHERE user_id = ? AND server_id = ?`,
        [user.id, dbServerId]
      )
      if (!usa) {
        return NextResponse.json({ error: 'No access to this server' }, { status: 403 })
      }
    }

    const channels = allChannels.map(channel => ({
      ...channel,
      eventTypes: JSON.parse(channel.event_types || '[]')
    }))

    
    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Get channels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new channel
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    const body = await request.json()
    const { name, slug, description, eventTypes, color, icon } = body
    
    // Check if user is global admin
    const isGlobalAdmin = Boolean(user.is_admin)
    
    // Check if user is server admin
    let isServerAdmin = false
    if (!isGlobalAdmin) {
      const serverAdminRecord = await queryOne(
        `SELECT * FROM server_admins WHERE server_id = ? AND discord_id = ? AND permission_level IN ('admin', 'moderator')`,
        [serverId, user.discord_id]
      )
      isServerAdmin = !!serverAdminRecord
    }
    
    if (!isGlobalAdmin && !isServerAdmin) {
      console.log('Permission denied for user:', user.discord_id, 'is_admin:', user.is_admin)
      return NextResponse.json({ error: 'No permission to create channels' }, { status: 403 })
    }
    
    // Create channel
    const result = await query(
      `INSERT INTO log_channels (server_id, name, slug, description, event_types, color, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serverId, name, slug || name.toLowerCase().replace(/\s+/g, '-'), description || '', JSON.stringify(eventTypes || []), color || '#6366f1', icon || 'file-text']
    )
    
    const channelId = result.insertId
    
    
    return NextResponse.json({
      channel: {
        id: channelId,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        eventTypes,
        color: color || '#6366f1',
        icon: icon || 'file-text'
      }
    })
  } catch (error) {
    console.error('Create channel error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// Update existing channel
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serverId } = await params
    const body = await request.json()
    const { id: channelId, name, slug, description, eventTypes, color, icon } = body

    if (!channelId) {
      return NextResponse.json({ error: 'Channel id required' }, { status: 400 })
    }

    // Resolve server (supports numeric id or identifier)
    const serverRow = await query(
      `SELECT id FROM servers WHERE id = ? OR identifier = ? LIMIT 1`,
      [serverId, serverId]
    )
    if (!serverRow || serverRow.length === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    const dbServerId = serverRow[0].id

    // Check if channel belongs to server
    const channelRow = await queryOne(
      `SELECT id FROM log_channels WHERE id = ? AND server_id = ? LIMIT 1`,
      [channelId, dbServerId]
    )
    if (!channelRow) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Permission: global admin or server admin/moderator
    const isGlobalAdmin = Boolean(user.is_admin)
    let isServerAdmin = false
    if (!isGlobalAdmin) {
      const serverAdminRecord = await queryOne(
        `SELECT 1 FROM server_admins WHERE server_id = ? AND discord_id = ? AND permission_level IN ('admin', 'moderator')`,
        [dbServerId, user.discord_id]
      )
      isServerAdmin = !!serverAdminRecord
    }
    if (!isGlobalAdmin && !isServerAdmin) {
      return NextResponse.json({ error: 'No permission to update channels' }, { status: 403 })
    }

    // Update channel
    await query(
      `UPDATE log_channels
       SET name = COALESCE(?, name),
           slug = COALESCE(?, slug),
           description = COALESCE(?, description),
           event_types = COALESCE(?, event_types),
           color = COALESCE(?, color),
           icon = COALESCE(?, icon)
       WHERE id = ? AND server_id = ?`,
      [
        name,
        slug || (name ? name.toLowerCase().replace(/\s+/g, '-') : null),
        description,
        eventTypes ? JSON.stringify(eventTypes) : null,
        color,
        icon,
        channelId,
        dbServerId
      ]
    )


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update channel error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

