'use client'

// Announcement banner: shows a message set by the admin at the top of the app.
// Fetches from /api/settings on mount. Dismissible per session.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, X } from 'lucide-react'

export function AnnouncementBanner() {
  // Check sessionStorage once on init (not in an effect)
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('mq-announcement-dismissed') === '1'
  })
  const { data } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const r = await fetch('/api/settings', { cache: 'no-store' })
      if (!r.ok) return null
      return r.json()
    },
    staleTime: 60_000,
  })

  const message = data?.announcement
  const maintenance = data?.maintenanceMode

  if (!message || dismissed) return null

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-sm text-white ${maintenance ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-500 to-fuchsia-500'}`}>
      <Megaphone className="h-4 w-4 shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      {!maintenance && (
        <button onClick={() => { setDismissed(true); sessionStorage.setItem('mq-announcement-dismissed', '1') }} className="shrink-0 opacity-80 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
