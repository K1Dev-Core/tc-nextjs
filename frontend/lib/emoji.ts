const BASE = 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main'

export const EMOJI_MAP: Record<string, { name: string; path: string }> = {
  '👍': { name: 'Thumbs Up', path: 'People/Thumbs%20Up.webp' },
  '❤️': { name: 'Red Heart', path: 'Symbols/Red%20Heart.webp' },
  '😂': { name: 'Face With Tears Of Joy', path: 'Smileys/Face%20With%20Tears%20Of%20Joy.webp' },
  '😮': { name: 'Face With Open Mouth', path: 'Smileys/Face%20With%20Open%20Mouth.webp' },
  '😢': { name: 'Crying Face', path: 'Smileys/Crying%20Face.webp' },
  '🔥': { name: 'Fire', path: 'Animals%20and%20Nature/Fire.webp' },
  '🎉': { name: 'Party Popper', path: 'Activity/Party%20Popper.webp' },
  '👏': { name: 'Clapping Hands', path: 'People/Clapping%20Hands.webp' },
  '🤔': { name: 'Thinking Face', path: 'Smileys/Thinking%20Face.webp' },
  '😎': { name: 'Smiling Face With Sunglasses', path: 'Smileys/Smiling%20Face%20With%20Sunglasses.webp' },
  '🥳': { name: 'Partying Face', path: 'Smileys/Partying%20Face.webp' },
  '😱': { name: 'Face Screaming In Fear', path: 'Smileys/Face%20Screaming%20In%20Fear.webp' },
}

export const QUICK_EMOJIS = Object.keys(EMOJI_MAP)

export function emojiUrl(emoji: string): string {
  const info = EMOJI_MAP[emoji]
  if (!info) return ''
  return `${BASE}/${info.path}`
}
