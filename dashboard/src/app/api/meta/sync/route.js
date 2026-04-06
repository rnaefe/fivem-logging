import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Ensures tables and upserts categories/eventTypes from backend meta/terms
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    const fetchTerms = async () => {
      const res = await fetch(`${backendUrl}/meta/terms?size=500`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`Failed to fetch terms from backend (${res.status})`)
      }
      return res.json()
    }

    // Fetch distinct terms from backend (ES) - no cache
    let data = await fetchTerms()
    let categories = data.categories || []
    let eventTypes = data.eventTypes || []

    // If eventTypes boş geldiyse bir kez daha dene (backend fallback'ı yakalamak için)
    if ((!eventTypes || eventTypes.length === 0) && categories.length > 0) {
      const retry = await fetchTerms()
      eventTypes = retry.eventTypes || eventTypes
    }

    // Create tables if not exist
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

    // Upsert categories
    for (const cat of categories) {
      if (!cat) continue
      await query(`INSERT IGNORE INTO categories (name) VALUES (?)`, [cat])
    }

    // Upsert event types
    for (const ev of eventTypes) {
      if (!ev) continue
      await query(`INSERT IGNORE INTO event_types (name) VALUES (?)`, [ev])
    }

    console.log(eventTypes)

    return NextResponse.json({
      synced: true,
      categories: categories.length,
      eventTypes: eventTypes.length,
      backendUrlUsed: backendUrl
    })
  } catch (error) {
    console.error('Meta sync failed:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

