'use client'

// Hook: fetches the current user via /api/auth/me.
// `refresh()` invalidates the query to force a refetch WITHOUT changing the
// query key — this avoids flipping `isLoading` to true (which would unmount
// child screens like GameplayScreen and wipe their local state).

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import type { PublicUser } from '@/types'

export function useCurrentUser() {
  const bumpRefresh = useAppStore((s) => s.bumpRefresh)
  const qc = useQueryClient()
  const q = useQuery<{ user: PublicUser | null }>({
    queryKey: ['me'],
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
    // Invalidate (refetch in background) without changing the query key,
    // so isLoading stays false and screens don't unmount.
    refresh: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      // Also bump the store nonce for any components that subscribe to it
      // (e.g. to trigger a re-render after a purchase).
      bumpRefresh()
    },
  }
}
