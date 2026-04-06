import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// Add server admin
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    const body = await request.json()
    const { discordId, permissionLevel = 'viewer' } = body
    
    await query(
      `INSERT INTO server_admins (server_id, discord_id, permission_level)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE permission_level = ?`,
      [serverId, discordId, permissionLevel, permissionLevel]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add server admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Remove server admin
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    const { searchParams } = new URL(request.url)
    const discordId = searchParams.get('discordId')
    
    await query(
      `DELETE FROM server_admins WHERE server_id = ? AND discord_id = ?`,
      [serverId, discordId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove server admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update server admin permission level
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    const body = await request.json()
    const { discordId, permissionLevel } = body
    
    if (!discordId || !permissionLevel) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    
    await query(
      `UPDATE server_admins 
       SET permission_level = ?
       WHERE server_id = ? AND discord_id = ?`,
      [permissionLevel, serverId, discordId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update server admin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

