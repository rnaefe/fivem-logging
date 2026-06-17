// ==========================================
// LOG SEARCH
// ==========================================

export async function searchLogs(params = {}) {
  const searchParams = new URLSearchParams()
  
  // Basic filters
  if (params.license) searchParams.append('license', params.license)
  if (params.event_type) searchParams.append('event_type', params.event_type)
  if (params.category) searchParams.append('category', params.category)
  if (params.q) searchParams.append('q', params.q)
  if (params.server_id) searchParams.append('server_id', params.server_id)
  
  // Advanced filters
  if (params.player_name) searchParams.append('player_name', params.player_name)
  if (params.server_name) searchParams.append('server_name', params.server_name)
  if (params.isDevServer) searchParams.append('isDevServer', params.isDevServer)
  if (params.date_from) searchParams.append('date_from', params.date_from)
  if (params.date_to) searchParams.append('date_to', params.date_to)
  
  // Pagination
  if (params.page) searchParams.append('page', params.page)
  if (params.limit) searchParams.append('limit', params.limit)

  const serverId = params.server_id
  if (!serverId) throw new Error('server_id is required')
  const url = `/api/servers/${serverId}/search?${searchParams.toString()}`

  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to load logs')
  }
  
  return response.json()
}

// ==========================================
// STATISTICS (from ES Backend)
// ==========================================

export async function getStats(params = {}) {
  const searchParams = new URLSearchParams()
  
  if (params.days) searchParams.append('days', params.days)
  if (params.server_id) searchParams.append('server_id', params.server_id)
  
  if (!params.server_id) throw new Error('server_id is required')
  const response = await fetch(`/api/servers/${params.server_id}/stats?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to load stats')
  }
  
  return response.json()
}

export async function getTopWeapons(params = {}) {
  const searchParams = new URLSearchParams()
  
  if (params.days) searchParams.append('days', params.days)
  if (params.limit) searchParams.append('limit', params.limit)
  if (params.server_id) searchParams.append('server_id', params.server_id)
  
  if (!params.server_id) throw new Error('server_id is required')
  searchParams.append('kind', 'weapons')
  const response = await fetch(`/api/servers/${params.server_id}/stats?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to load weapon stats')
  }
  
  return response.json()
}

export async function getTopVehicles(params = {}) {
  const searchParams = new URLSearchParams()
  
  if (params.days) searchParams.append('days', params.days)
  if (params.limit) searchParams.append('limit', params.limit)
  if (params.server_id) searchParams.append('server_id', params.server_id)
  
  if (!params.server_id) throw new Error('server_id is required')
  searchParams.append('kind', 'vehicles')
  const response = await fetch(`/api/servers/${params.server_id}/stats?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to load vehicle stats')
  }
  
  return response.json()
}

// ==========================================
// RECENT LOGS (shortcut)
// ==========================================

export async function getRecentLogs(limit = 10, server_id) {
  return searchLogs({ limit, page: 1, server_id })
}
