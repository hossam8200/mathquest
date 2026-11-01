'use client'

// Hook: fetches the current user via /api/auth/me, with a refresh nonce
// that lets other parts of the app force a refetch (e.g. after purchase).

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import type { PublicUser } from '@/types'

export function useCurrentUser() {
  const refreshNonce = useAppStore((s) => s.refreshNonce)
  const qc = useQueryClient()
  const q = useQuery<{ user: PublicUser | null }>({
    queryKey: ['me', refreshNonce],
    queryFn: async () => {
      const r = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!r.ok) return { user: null }
      return r.json()
    },
  })
  return {
    user: q.data?.user ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
    refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
  }
}
