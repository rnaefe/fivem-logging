import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// Get all servers (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const servers = await query(
      `SELECT id, name, identifier, discord_guild_id, api_key, is_active, created_at, updated_at
       FROM servers
       ORDER BY created_at DESC`
    )
    
    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Get all servers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

