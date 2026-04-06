"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [servers, setServers] = useState([])
  const [currentServer, setCurrentServer] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (data.user) {
        setUser(data.user)
        setServers(data.servers || [])
        
        // Set first server as current if none selected
        if (data.servers?.length > 0 && !currentServer) {
          const savedServer = localStorage.getItem('currentServerId')
          const server = savedServer 
            ? data.servers.find(s => s.id === parseInt(savedServer)) 
            : data.servers[0]
          setCurrentServer(server || data.servers[0])
        }
      } else {
        setUser(null)
        setServers([])
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  function selectServer(server) {
    setCurrentServer(server)
    localStorage.setItem('currentServerId', server.id.toString())
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setServers([])
    setCurrentServer(null)
    localStorage.removeItem('currentServerId')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      servers, 
      currentServer, 
      selectServer, 
      loading, 
      logout,
      refresh: checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

