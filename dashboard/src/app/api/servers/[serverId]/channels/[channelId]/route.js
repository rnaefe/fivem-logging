import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// Update channel
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId, channelId } = await params
    const body = await request.json()
    const { name, slug, description, eventTypes, color, icon, isActive } = body
    
    await query(
      `UPDATE log_channels SET 
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        event_types = COALESCE(?, event_types),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active)
       WHERE id = ? AND server_id = ?`,
      [
        name, 
        slug, 
        description, 
        eventTypes ? JSON.stringify(eventTypes) : null,
        color,
        icon,
        isActive,
        channelId, 
        serverId
      ]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update channel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete channel
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId, channelId } = await params
    
    await query(
      `DELETE FROM log_channels WHERE id = ? AND server_id = ?`,
      [channelId, serverId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete channel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

