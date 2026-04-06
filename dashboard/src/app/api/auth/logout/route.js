import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'

export async function POST() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (token) {
    await query(`DELETE FROM sessions WHERE token = ?`, [token])
  }
  cookieStore.delete('auth_token')
  cookieStore.delete('discord_token')
  
  return NextResponse.json({ success: true })
}

export async function GET(request) {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (token) {
    await query(`DELETE FROM sessions WHERE token = ?`, [token])
  }
  cookieStore.delete('auth_token')
  cookieStore.delete('discord_token')
  
  return NextResponse.redirect(new URL('/login', request.url))
}

