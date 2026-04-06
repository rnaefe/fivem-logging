import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  getCurrentUser, 
  syncUserServerAccess, 
  getSessionByToken, 
  refreshDiscordToken, 
  upsertSession 
} from '@/lib/auth'

// Refresh Discord token (if needed) and resync roles without logout/login
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = cookies()
    const authToken = cookieStore.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const session = await getSessionByToken(authToken)
    if (!session) {
      return NextResponse.json({ error: 'Session not found, please re-login' }, { status: 401 })
    }
    if (!session.discord_refresh_token) {
      return NextResponse.json({ error: 'No Discord refresh token, please re-login' }, { status: 401 })
    }

    let accessToken = session.discord_access_token
    let refreshed = false

    const now = new Date()
    const expiresAt = session.discord_expires_at ? new Date(session.discord_expires_at) : null
    const needsRefresh = !expiresAt || expiresAt <= now

    if (needsRefresh) {
      const tokenData = await refreshDiscordToken(session.discord_refresh_token)
      accessToken = tokenData.access_token
      refreshed = true

      await upsertSession({
        userId: user.id,
        token: authToken,
        discordAccessToken: tokenData.access_token,
        discordRefreshToken: tokenData.refresh_token || session.discord_refresh_token,
        discordExpiresIn: tokenData.expires_in
      })

      // Update cookie for access token (optional, mirrors login behavior)
      cookieStore.set('discord_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in
      })
    }

    // Resync roles with fresh access token
    await syncUserServerAccess(user.id, accessToken)

    return NextResponse.json({ success: true, refreshed })
  } catch (error) {
    console.error('refresh-roles error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


