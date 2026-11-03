// DiceBear avatar helper — generates unique SVG avatars from text seeds.
// Free, open-source, no API key needed. SVG = crisp at any size, tiny file size.
// Privacy-safe: only uses nicknames as seeds, no personal data.
//
// OFFLINE FALLBACK: If DiceBear API is unavailable (offline PWA mode, API down),
// a colored-circle SVG is generated inline as a data URI — no external files needed.
// Kenney.nl CC0 assets can also be bundled in /public/assets/kenney/ for richer
// offline sprites (see README for instructions).

export type DiceBearStyle =
  | 'adventurer'   // heroic illustrated characters
  | 'fun-emoji'    // playful emoji-style
  | 'avataaars'    // human-like avatars
  | 'bottts'       // robot characters
  | 'identicon'    // geometric patterns
  | 'lorelei'      // illustrated portraits
  | 'notionists'   // Notion-style people
  | 'open-peeps'   // hand-drawn people
  | 'personas'     // flat illustrations
  | 'thumbs'       // thumbs up characters

const BASE = 'https://api.dicebear.com/10.x'

// Color palette for fallback avatars (derived from seed)
const FALLBACK_COLORS = [
  '#fb7185', '#fbbf24', '#34d399', '#a78bfa', '#22d3ee', '#f472b6',
  '#fb923c', '#a3e635', '#60a5fa', '#c084fc', '#2dd4bf', '#f59e0b',
]

function colorFromSeed(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

/**
 * Generate an inline SVG data URI as a fallback avatar.
 * Shows a colored circle with the seed's first 2 letters.
 * No external dependency — always works, even offline.
 */
export function fallbackAvatar(seed: string, size = 80): string {
  const color = colorFromSeed(seed)
  const initials = seed.slice(0, 2).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/><text x="${size / 2}" y="${size / 2 + size / 8}" font-size="${size / 3}" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-weight="bold">${initials}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Generate an inline SVG fallback for a marketplace character.
 * Shows the character's emoji on a colored circle.
 */
export function characterFallback(key: string, emoji: string, size = 80): string {
  const color = colorFromSeed(key)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/><text x="${size / 2}" y="${size / 2 + size / 6}" font-size="${size / 2}" text-anchor="middle">${emoji}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Generate a DiceBear avatar URL from a seed string.
 * @param seed - any text (nickname, character key, badge key, etc.)
 * @param style - DiceBear style
 * @param size - pixel size (default 80)
 * @returns URL string for the SVG avatar
 */
export function avatarUrl(seed: string, style: DiceBearStyle = 'adventurer', size = 80): string {
  const encoded = encodeURIComponent(seed)
  return `${BASE}/${style}/svg?seed=${encoded}&size=${size}&radius=50&backgroundColor=ffd5dc,ffdfbf,d1f4ff,b5e8d4,c0aede,ffcd6e`
}

/**
 * Map character rarity to a DiceBear style.
 * Common → fun-emoji, Rare → bottts, Epic → avataaars, Legendary → adventurer
 */
export function styleForRarity(rarity: string): DiceBearStyle {
  switch (rarity) {
    case 'common': return 'fun-emoji'
    case 'rare': return 'bottts'
    case 'epic': return 'avataaars'
    case 'legendary': return 'adventurer'
    default: return 'fun-emoji'
  }
}

/**
 * Map operation to a DiceBear style for deck covers.
 */
export function styleForOperation(operation: string): DiceBearStyle {
  switch (operation) {
    case 'addition': return 'fun-emoji'
    case 'subtraction': return 'bottts'
    case 'multiplication': return 'avataaars'
    case 'division': return 'adventurer'
    case 'mixed': return 'lorelei'
    default: return 'fun-emoji'
  }
}

/**
 * Get a consistent avatar for a nickname.
 * Uses 'adventurer' style for a heroic, kid-friendly look.
 */
export function kidAvatar(nickname: string, size = 80): string {
  return avatarUrl(nickname, 'adventurer', size)
}

/**
 * Get a quest-giver avatar (mysterious NPC style).
 */
export function questGiverAvatar(questId: string, size = 80): string {
  return avatarUrl(`quest-${questId}`, 'lorelei', size)
}
