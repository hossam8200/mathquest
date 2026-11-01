'use client'

// Confetti burst — used on level complete (1-3 stars) and on perfect rounds.
// Pieces are generated once via a state initializer; the parent controls
// mount/unmount (and can use a `key` to re-trigger).

import { useState } from 'react'

interface Piece {
  id: number
  left: number
  delay: number
  color: string
  rotation: number
}

const COLORS = ['#fb7185', '#fbbf24', '#34d399', '#a78bfa', '#22d3ee', '#f472b6']

function generatePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
  }))
}

export function Confetti({ count = 30 }: { count?: number }) {
  // State initializer runs once per mount. Parent uses `key` to re-trigger.
  const [pieces] = useState(() => generatePieces(count))

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="mq-confetti"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}
