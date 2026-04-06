"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings } from 'lucide-react'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const avatarUrl = user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`

  return (
    <div className="relative z-[60]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-zinc-900 rounded-lg p-2 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={avatarUrl} 
          alt={user.username}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm text-zinc-300 hidden md:block">{user.username}</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-[70]">
            <div className="p-3 border-b border-zinc-800">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-zinc-500">Discord ID: {user.discordId}</p>
            </div>
            <div className="p-1">
              <button 
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button 
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

