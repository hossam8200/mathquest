'use client'

// DiceBear Avatar component — renders a unique SVG avatar from a seed string.
// Used for: kid profiles, leaderboard, marketplace characters, word problems, etc.

import { kidAvatar, avatarUrl, styleForRarity, type DiceBearStyle } from '@/lib/dicebear'

interface AvatarProps {
  seed: string
  style?: DiceBearStyle
  size?: number
  className?: string
  alt?: string
}

export function Avatar({ seed, style = 'adventure', size = 80, className, alt }: AvatarProps) {
  const url = avatarUrl(seed, style, size)
  return (
    <img
      src={url}
      alt={alt || `Avatar for ${seed}`}
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  )
}

// Convenience: kid avatar from nickname
export function KidAvatar({ nickname, size = 80, className }: { nickname: string; size?: number; className?: string }) {
  const url = kidAvatar(nickname, size)
  return (
    <img
      src={url}
      alt={nickname}
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  )
}

// Convenience: character avatar with rarity-based style
export function CharacterAvatar({ characterKey, rarity, size = 80, className }: { characterKey: string; rarity: string; size?: number; className?: string }) {
  const style = styleForRarity(rarity)
  const url = avatarUrl(characterKey, style, size)
  return (
    <img
      src={url}
      alt={characterKey}
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  )
}
