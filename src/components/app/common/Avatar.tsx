'use client'

// DiceBear Avatar component with offline fallback.
// Primary: DiceBear API (unique per nickname, online)
// Fallback: Inline SVG data URI (colored circle + initials/emoji, always works offline)

import { useState } from 'react'
import { kidAvatar, avatarUrl, styleForRarity, fallbackAvatar, characterFallback, type DiceBearStyle } from '@/lib/dicebear'

interface AvatarProps {
  seed: string
  style?: DiceBearStyle
  size?: number
  className?: string
  alt?: string
}

export function Avatar({ seed, style = 'adventurer', size = 80, className, alt }: AvatarProps) {
  const [src, setSrc] = useState(avatarUrl(seed, style, size))
  return (
    <img
      src={src}
      alt={alt || `Avatar for ${seed}`}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={() => setSrc(fallbackAvatar(seed, size))}
    />
  )
}

// Convenience: kid avatar from nickname (with fallback)
export function KidAvatar({ nickname, size = 80, className }: { nickname: string; size?: number; className?: string }) {
  const [src, setSrc] = useState(kidAvatar(nickname, size))
  return (
    <img
      src={src}
      alt={nickname}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={() => setSrc(fallbackAvatar(nickname, size))}
    />
  )
}

// Convenience: character avatar with rarity-based style (with fallback)
export function CharacterAvatar({ characterKey, rarity, emoji, size = 80, className }: { characterKey: string; rarity: string; emoji: string; size?: number; className?: string }) {
  const style = styleForRarity(rarity)
  const [src, setSrc] = useState(avatarUrl(characterKey, style, size))
  return (
    <img
      src={src}
      alt={characterKey}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={() => setSrc(characterFallback(characterKey, emoji, size))}
    />
  )
}
