import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryOne } from '@/lib/db'

// Get user's permissions for a server
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { serverId } = await params
    
    // Check if global admin
    const isGlobalAdmin = Boolean(user.is_admin)
    
    if (isGlobalAdmin) {
      return NextResponse.json({
        isGlobalAdmin: true,
        isServerAdmin: true,
        canManageChannels: true,
        canManageUsers: true,
        canViewLogs: true,
        permissionLevel: 'global_admin'
      })
    }
    
    // Check server admin
    const serverAdmin = await queryOne(
      `SELECT * FROM server_admins WHERE server_id = ? AND discord_id = ?`,
      [serverId, user.discord_id]
    )
    
    if (serverAdmin) {
      const isAdmin = serverAdmin.permission_level === 'admin'
      const isModerator = serverAdmin.permission_level === 'moderator'
      
      return NextResponse.json({
        isGlobalAdmin: false,
        isServerAdmin: true,
        canManageChannels: isAdmin || isModerator,
        canManageUsers: isAdmin,
        canViewLogs: true,
        permissionLevel: serverAdmin.permission_level
      })
    }
    
    // Regular user with server access
    const hasAccess = await queryOne(
      `SELECT * FROM user_server_access WHERE user_id = ? AND server_id = ?`,
      [user.id, serverId]
    )
    
    return NextResponse.json({
      isGlobalAdmin: false,
      isServerAdmin: false,
      canManageChannels: false,
      canManageUsers: false,
      canViewLogs: !!hasAccess,
      permissionLevel: 'viewer'
    })
  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

