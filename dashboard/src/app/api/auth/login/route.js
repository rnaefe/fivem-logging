import { NextResponse } from 'next/server'
import { getDiscordAuthUrl } from '@/lib/auth'

export async function GET() {
  const authUrl = getDiscordAuthUrl()
  return NextResponse.redirect(authUrl)
}

