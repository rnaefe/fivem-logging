import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// Get single server details
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    
    const server = await queryOne(
      `SELECT * FROM servers WHERE id = ?`,
      [serverId]
    )
    
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    
    // Get channels for this server
    const channels = await query(
      `SELECT * FROM log_channels WHERE server_id = ? ORDER BY name`,
      [serverId]
    )
    
    // Get admins for this server
    const admins = await query(
      `SELECT sa.*, u.discord_username, u.discord_avatar
       FROM server_admins sa
       LEFT JOIN users u ON u.discord_id = sa.discord_id
       WHERE sa.server_id = ?`,
      [serverId]
    )
    
    return NextResponse.json({ server, channels, admins })
  } catch (error) {
    console.error('Get server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update server
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    const body = await request.json()
    const { name, identifier, discordGuildId, isActive } = body

    if (discordGuildId !== undefined && !discordGuildId) {
      return NextResponse.json({ error: 'discordGuildId boş olamaz' }, { status: 400 })
    }
    
    await query(
      `UPDATE servers SET 
        name = COALESCE(?, name),
        identifier = COALESCE(?, identifier),
        discord_guild_id = COALESCE(?, discord_guild_id),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, identifier, discordGuildId, isActive, serverId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete server
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    
    await query(`DELETE FROM servers WHERE id = ?`, [serverId])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Regenerate API key
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    const newApiKey = `fivem_${crypto.randomUUID()}`
    
    await query(
      `UPDATE servers SET api_key = ? WHERE id = ?`,
      [newApiKey, serverId]
    )
    
    return NextResponse.json({ apiKey: newApiKey })
  } catch (error) {
    console.error('Regenerate API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

