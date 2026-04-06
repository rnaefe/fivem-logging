import { NextResponse } from 'next/server'
import { getCurrentUser, getUserServers } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const servers = await getUserServers(user.id)
    
    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Get servers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin: Create new server
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !Boolean(user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, identifier, discordGuildId } = body
    
    if (!name || !identifier || !discordGuildId) {
      return NextResponse.json({ error: 'name, identifier ve discordGuildId zorunlu' }, { status: 400 })
    }
    
    // Generate API key
    const apiKey = `fivem_${crypto.randomUUID()}`
    
    const result = await query(
      `INSERT INTO servers (name, identifier, discord_guild_id, api_key)
       VALUES (?, ?, ?, ?)`,
      [name, identifier, discordGuildId, apiKey]
    )
    
    return NextResponse.json({
      id: result.insertId,
      name,
      identifier,
      apiKey
    })
  } catch (error) {
    console.error('Create server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

