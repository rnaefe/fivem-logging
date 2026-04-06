import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Ensure tables
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await query(`
      CREATE TABLE IF NOT EXISTS event_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const categories = await query(`SELECT name FROM categories ORDER BY name ASC`)
    const eventTypes = await query(`SELECT name FROM event_types ORDER BY name ASC`)

    return NextResponse.json({
      categories: categories.map(c => c.name),
      eventTypes: eventTypes.map(e => e.name)
    })
  } catch (error) {
    console.error('Meta list failed:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

