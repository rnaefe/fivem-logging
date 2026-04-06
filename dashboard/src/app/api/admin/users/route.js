import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

// Get all users (admin only)
export async function GET(request) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const like = `%${q}%`

    const users = await query(
      `SELECT id, discord_id, discord_username, discord_avatar, discord_email, is_admin, last_login, created_at
       FROM users
       WHERE (? = '' 
              OR discord_username LIKE ?
              OR discord_id LIKE ?
              OR discord_email LIKE ?)
       ORDER BY created_at DESC
       LIMIT 50`,
      [q, like, like, like]
    )
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get all users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

