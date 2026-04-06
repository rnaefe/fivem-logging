import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { query, queryOne } from './db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this'
)

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/api/auth/callback'

// Generate Discord OAuth URL
export function getDiscordAuthUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds guilds.members.read'
  })
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`
}

// Exchange code for tokens
export async function exchangeCodeForToken(code) {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }
  
  return response.json()
}

// Get Discord user info
export async function getDiscordUser(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get Discord user')
  }
  
  return response.json()
}

// Get user's guilds (servers)
export async function getDiscordGuilds(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get Discord guilds')
  }
  
  return response.json()
}

// Get user's roles in a specific guild
export async function getGuildMember(accessToken, guildId) {
  const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    return null // User not in guild or no access
  }
  
  return response.json()
}

// Create or update user in database
export async function upsertUser(discordUser) {
  const existing = await queryOne(
    'SELECT * FROM users WHERE discord_id = ?',
    [discordUser.id]
  )
  
  if (existing) {
    await query(
      `UPDATE users SET 
        discord_username = ?, 
        discord_avatar = ?, 
        discord_email = ?,
        last_login = NOW()
      WHERE discord_id = ?`,
      [
        discordUser.username,
        discordUser.avatar,
        discordUser.email || null,
        discordUser.id
      ]
    )
    return { ...existing, discord_username: discordUser.username }
  }
  
  const result = await query(
    `INSERT INTO users (discord_id, discord_username, discord_avatar, discord_email, last_login)
     VALUES (?, ?, ?, ?, NOW())`,
    [
      discordUser.id,
      discordUser.username,
      discordUser.avatar,
      discordUser.email || null
    ]
  )
  
  return {
    id: result.insertId,
    discord_id: discordUser.id,
    discord_username: discordUser.username,
    discord_avatar: discordUser.avatar
  }
}

// Create JWT token
export async function createToken(user) {
  const token = await new SignJWT({
    userId: user.id,
    discordId: user.discord_id,
    username: user.discord_username
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  
  return token
}

// Create / update session with Discord tokens
export async function upsertSession({ userId, token, discordAccessToken, discordRefreshToken, discordExpiresIn }) {
  const expiresSeconds = 60 * 60 * 24 * 7 // 7 days for auth token
  const accessSeconds = discordExpiresIn || 3600
  await query(
    `INSERT INTO sessions (user_id, token, expires_at, discord_access_token, discord_refresh_token, discord_expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
     ON DUPLICATE KEY UPDATE 
       user_id = VALUES(user_id),
       expires_at = VALUES(expires_at),
       discord_access_token = VALUES(discord_access_token),
       discord_refresh_token = VALUES(discord_refresh_token),
       discord_expires_at = VALUES(discord_expires_at)`,
    [userId, token, expiresSeconds, discordAccessToken || null, discordRefreshToken || null, accessSeconds]
  )
}

export async function getSessionByToken(token) {
  return queryOne(
    `SELECT * FROM sessions WHERE token = ?`,
    [token]
  )
}

export async function refreshDiscordToken(refreshToken) {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Discord token')
  }

  return response.json()
}

// Verify JWT token
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

// Get current user from cookies
export async function getCurrentUser() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) {
    return null
  }
  
  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }
  
  const user = await queryOne(
    'SELECT * FROM users WHERE id = ?',
    [payload.userId]
  )
  
  return user
}

// Get servers user has access to
export async function getUserServers(userId) {
  const servers = await query(
    `SELECT s.* 
     FROM servers s
     INNER JOIN user_server_access usa ON s.id = usa.server_id
     WHERE usa.user_id = ? AND s.is_active = TRUE`,
    [userId]
  )
  return servers
}

// Check if user has access to a channel
export async function canAccessChannel(userId, channelId) {
  const access = await queryOne(
    `SELECT s.id FROM log_channels lc
     INNER JOIN servers s ON lc.server_id = s.id
     INNER JOIN user_server_access usa ON s.id = usa.server_id
     WHERE usa.user_id = ? AND lc.id = ?`,
    [userId, channelId]
  )
  return !!access
}

// Update user's server access based on Discord guilds
export async function syncUserServerAccess(userId, discordAccessToken) {
  const guilds = await getDiscordGuilds(discordAccessToken)
  const guildIds = guilds.map(g => g.id)
  
  if (guildIds.length === 0) {
    return // No guilds to sync
  }
  
  // Get servers that match user's Discord guilds
  // MySQL requires individual placeholders for IN clause
  const placeholders = guildIds.map(() => '?').join(', ')
  const servers = await query(
    `SELECT * FROM servers WHERE discord_guild_id IN (${placeholders})`,
    guildIds
  )
  
  for (const server of servers) {
    // Get user's presence in this guild
    const member = await getGuildMember(discordAccessToken, server.discord_guild_id)
    if (member) {
      await query(
        `INSERT INTO user_server_access (user_id, server_id, last_verified)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE last_verified = NOW()`,
        [userId, server.id]
      )
    }
  }
}

