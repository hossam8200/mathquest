// DiceBear avatar helper — generates unique SVG avatars from text seeds.
// Free, open-source, no API key needed. SVG = crisp at any size, tiny file size.
// Privacy-safe: only uses nicknames as seeds, no personal data.

export type DiceBearStyle =
  | 'adventure'    // heroic illustrated characters
  | 'fun-emoji'    // playful emoji-style
  | 'avataaars'    // human-like avatars
  | 'bottts'       // robot characters
  | 'identicon'    // geometric patterns
  | 'lorelei'      // illustrated portraits
  | 'notionists'   // Notion-style people
  | 'open-peeps'   // hand-drawn people
  | 'personas'     // flat illustrations
  | 'thumbs'       // thumbs up characters

const BASE = 'https://api.dicebear.com/7.x'

/**
 * Generate a DiceBear avatar URL from a seed string.
 * @param seed - any text (nickname, character key, badge key, etc.)
 * @param style - DiceBear style
 * @param size - pixel size (default 80)
 * @returns URL string for the SVG avatar
 */
export function avatarUrl(seed: string, style: DiceBearStyle = 'adventure', size = 80): string {
  const encoded = encodeURIComponent(seed)
  return `${BASE}/${style}/svg?seed=${encoded}&size=${size}&radius=50&backgroundColor=ffd5dc,ffdfbf,d1f4ff,b5e8d4,c0aede,ffcd6e`
}

/**
 * Map character rarity to a DiceBear style.
 * Common → fun-emoji, Rare → bottts, Epic → avataaars, Legendary → adventure
 */
export function styleForRarity(rarity: string): DiceBearStyle {
  switch (rarity) {
    case 'common': return 'fun-emoji'
    case 'rare': return 'bottts'
    case 'epic': return 'avataaars'
    case 'legendary': return 'adventure'
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
    case 'division': return 'adventure'
    case 'mixed': return 'lorelei'
    default: return 'fun-emoji'
  }
}

/**
 * Get a consistent avatar for a nickname.
 * Uses 'adventure' style for a heroic, kid-friendly look.
 */
export function kidAvatar(nickname: string, size = 80): string {
  return avatarUrl(nickname, 'adventure', size)
}

/**
 * Get a quest-giver avatar (mysterious NPC style).
 */
export function questGiverAvatar(questId: string, size = 80): string {
  return avatarUrl(`quest-${questId}`, 'lorelei', size)
}
