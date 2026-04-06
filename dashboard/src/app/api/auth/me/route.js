import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  getCurrentUser, 
  getUserServers, 
  syncUserServerAccess, 
  getSessionByToken, 
  refreshDiscordToken, 
  upsertSession 
} from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // On each call, try to refresh Discord token if expired and resync roles
    try {
      const cookieStore = cookies()
      const authToken = cookieStore.get('auth_token')?.value
      if (authToken) {
        // Prune expired sessions for this user
        await query(`DELETE FROM sessions WHERE user_id = ? AND expires_at <= NOW()`, [user.id])

        const session = await getSessionByToken(authToken)
        if (!session) {
          // Session not found: drop cookies and force re-login
          cookieStore.delete('auth_token')
          cookieStore.delete('discord_token')
          return NextResponse.json({ user: null }, { status: 401 })
        }
        if (session?.discord_refresh_token) {
          let accessToken = session.discord_access_token
          const now = new Date()
          const expiresAt = session.discord_expires_at ? new Date(session.discord_expires_at) : null
          const needsRefresh = !expiresAt || expiresAt <= now

          const doRefresh = async () => {
            const tokenData = await refreshDiscordToken(session.discord_refresh_token)
            accessToken = tokenData.access_token
            await upsertSession({
              userId: user.id,
              token: authToken,
              discordAccessToken: tokenData.access_token,
              discordRefreshToken: tokenData.refresh_token || session.discord_refresh_token,
              discordExpiresIn: tokenData.expires_in
            })
            // mirror callback behavior for optional cookie
            cookies().set('discord_token', tokenData.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: tokenData.expires_in
            })
          }

          if (needsRefresh) {
            await doRefresh()
          }

          // Try sync; if fails, refresh once and retry
          const trySync = async () => {
            if (accessToken) {
              try {
                await syncUserServerAccess(user.id, accessToken)
              } catch (err) {
                // Attempt refresh once on failure
                await doRefresh()
                await syncUserServerAccess(user.id, accessToken)
              }
            }
          }

          await trySync()
        }
      }
    } catch (e) {
      console.error('Role resync during /api/auth/me failed:', e)
      // En azından eski rol cache'ini geçersiz kıl: roller boş olsun ki yetkisiz erişim olmasın
      try {
        await query(`UPDATE user_server_access SET discord_roles = '[]', last_verified = NOW() WHERE user_id = ?`, [user.id])
      } catch (err2) {
        console.error('Failed to clear stale roles after sync failure:', err2)
      }
      // Do not block response; proceed with existing data
    }
    
    // Server list resolution:
    // - Global admin: all servers
    // - Server admin (server_admins): those servers
    // - User assigned (user_server_access): those servers
    let servers = []
    if (Boolean(user.is_admin)) {
      servers = await query(`SELECT id, name, identifier FROM servers ORDER BY created_at DESC`)
    } else {
      servers = await query(
        `
        SELECT DISTINCT s.id, s.name, s.identifier
        FROM servers s
        LEFT JOIN user_server_access usa ON usa.server_id = s.id AND usa.user_id = ?
        LEFT JOIN server_admins sa ON sa.server_id = s.id AND sa.discord_id = ?
        WHERE usa.user_id IS NOT NULL OR sa.discord_id IS NOT NULL
        ORDER BY s.created_at DESC
        `,
        [user.id, user.discord_id]
      )
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        discordId: user.discord_id,
        username: user.discord_username,
        avatar: user.discord_avatar,
        isAdmin: Boolean(user.is_admin)
      },
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        identifier: s.identifier
      }))
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

