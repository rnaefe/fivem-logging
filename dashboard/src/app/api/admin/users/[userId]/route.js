import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// Get single user details
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = await params
    
    const targetUser = await queryOne(
      `SELECT id, discord_id, discord_username, discord_avatar, discord_email, is_admin, last_login, created_at
       FROM users WHERE id = ?`,
      [userId]
    )
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get server access: viewer records
    const viewerAccess = await query(
      `SELECT usa.server_id, s.name as server_name, s.identifier, 'viewer' as role
       FROM user_server_access usa
       JOIN servers s ON s.id = usa.server_id
       WHERE usa.user_id = ?`,
      [userId]
    )

    // Get server admin/mod records
    const adminAccess = await query(
      `SELECT sa.server_id, s.name as server_name, s.identifier, sa.permission_level as role
       FROM server_admins sa
       JOIN servers s ON s.id = sa.server_id
       WHERE sa.discord_id = ?`,
      [targetUser.discord_id]
    )

    // Merge per server: admin > moderator > viewer
    const rank = { admin: 3, moderator: 2, viewer: 1 }
    const merged = {}
    for (const rec of [...viewerAccess, ...adminAccess]) {
      const key = rec.server_id
      const current = merged[key]
      if (!current || (rank[rec.role] || 0) > (rank[current.role] || 0)) {
        merged[key] = rec
      }
    }
    const serverAccess = Object.values(merged)
    
    return NextResponse.json({ user: targetUser, serverAccess })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update user (toggle admin, etc.)
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = await params
    const body = await request.json()
    const { isAdmin } = body
    
    await query(
      `UPDATE users SET is_admin = ? WHERE id = ?`,
      [isAdmin, userId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete user
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = await params
    
    // Don't allow self-deletion
    if (user.id === parseInt(userId)) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }
    
    await query(`DELETE FROM users WHERE id = ?`, [userId])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Grant/revoke server access
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = await params
    const body = await request.json()
    const { serverId, action } = body // action: 'grant' or 'revoke'
    
    if (action === 'grant') {
      await query(
        `INSERT IGNORE INTO user_server_access (user_id, server_id) VALUES (?, ?)`,
        [userId, serverId]
      )
    } else if (action === 'revoke') {
      await query(
        `DELETE FROM user_server_access WHERE user_id = ? AND server_id = ?`,
        [userId, serverId]
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user access error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

