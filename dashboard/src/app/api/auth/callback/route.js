import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  exchangeCodeForToken, 
  getDiscordUser, 
  upsertUser, 
  createToken,
  syncUserServerAccess,
  upsertSession
} from '@/lib/auth'

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(new URL('/login?error=discord_denied', request.url))
  }
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }
  
  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code)
    
    // Get user info
    const discordUser = await getDiscordUser(tokenData.access_token)
    
    // Create/update user in database
    const user = await upsertUser(discordUser)
    
    // Sync server access
    await syncUserServerAccess(user.id, tokenData.access_token)
    
    // Create JWT
    const token = await createToken(user)
    
    // Persist session with Discord tokens
    await upsertSession({
      userId: user.id,
      token,
      discordAccessToken: tokenData.access_token,
      discordRefreshToken: tokenData.refresh_token,
      discordExpiresIn: tokenData.expires_in
    })

    // Set cookie
    const cookieStore = cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    // Store Discord access token for future syncs (optional)
    cookieStore.set('discord_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in
    })
    
    return NextResponse.redirect(new URL('/', request.url))
    
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}

