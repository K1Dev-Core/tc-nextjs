export interface RemoteSfxItem {
  id: string
  name: string
  emoji: string
  color: string
  url: string
  source: string
}

export const SFX_COOLDOWN_MS = 60_000
const SFX_SIGNAL_PREFIX = '\u2063\u2063'
const SFX_ZERO = '\u200b'
const SFX_ONE = '\u200c'

function encodeInvisibleAscii(value: string) {
  return [...value].map((char) => char.charCodeAt(0).toString(2).padStart(8, '0').replaceAll('0', SFX_ZERO).replaceAll('1', SFX_ONE)).join('')
}

function decodeInvisibleAscii(value: string) {
  if (value.length % 8 !== 0) return ''
  let out = ''
  for (let i = 0; i < value.length; i += 8) {
    const byte = value.slice(i, i + 8)
    let bits = ''
    for (const char of byte) {
      if (char === SFX_ZERO) bits += '0'
      else if (char === SFX_ONE) bits += '1'
      else return ''
    }
    out += String.fromCharCode(parseInt(bits, 2))
  }
  return out
}

export function encodeSfxSignal(item: Pick<RemoteSfxItem, 'id'>) {
  return `${SFX_SIGNAL_PREFIX}${encodeInvisibleAscii(item.id)}`
}

export function decodeSfxSignal(content?: string) {
  if (!content?.startsWith(SFX_SIGNAL_PREFIX)) return null
  const id = decodeInvisibleAscii(content.slice(SFX_SIGNAL_PREFIX.length))
  if (!id) return null
  return findRemoteSfx(id) ?? null
}

export const REMOTE_SFX: RemoteSfxItem[] = [
  {
    id: 'faaah',
    name: 'Faaah',
    emoji: '🗣️',
    color: '#ef4444',
    url: '/sfx/faaah.mp3',
    source: 'https://www.myinstants.com/en/instant/faaah-63455/',
  },
  {
    id: 'error',
    name: 'Error',
    emoji: '⚠️',
    color: '#f97316',
    url: '/sfx/error.mp3',
    source: 'https://www.myinstants.com/en/instant/error-soundss-25534/',
  },
  {
    id: 'baby-laugh',
    name: 'Baby Laugh',
    emoji: '👶',
    color: '#ec4899',
    url: '/sfx/baby-laugh.mp3',
    source: 'https://www.myinstants.com/en/instant/baby-laughing-meme-56428/',
  },
  {
    id: 'outro-song',
    name: 'Outro Song',
    emoji: '🎵',
    color: '#8b5cf6',
    url: '/sfx/outro-song.mp3',
    source: 'https://www.myinstants.com/en/instant/outro-song-77850/',
  },
  {
    id: 'minecraft-oof',
    name: 'Minecraft Oof',
    emoji: '🧱',
    color: '#22c55e',
    url: '/sfx/minecraft-oof.mp3',
    source: 'https://www.myinstants.com/en/instant/oof-minecraft-61039/',
  },
  {
    id: 'minecraft-door',
    name: 'MC Door',
    emoji: '🚪',
    color: '#a16207',
    url: '/sfx/minecraft-door.mp3',
    source: 'https://www.myinstants.com/en/instant/minecraft-door-meme-78947/',
  },
  {
    id: 'helicopter',
    name: 'Helicopter',
    emoji: '🚁',
    color: '#06b6d4',
    url: '/sfx/helicopter.mp3',
    source: 'https://www.myinstants.com/en/instant/helicopter-meme-80475/',
  },
  {
    id: 'sacred',
    name: 'สิ่งศักดิ์สิทธิ์',
    emoji: '🙏',
    color: '#eab308',
    url: '/sfx/sacred.mp3',
    source: 'https://www.myinstants.com/en/instant/singsakdisiththi-1158/',
  },
  {
    id: 'revenge',
    name: 'กูแค้น',
    emoji: '😤',
    color: '#dc2626',
    url: '/sfx/revenge.mp3',
    source: 'https://www.myinstants.com/en/instant/kuuaekhn-47525/',
  },
  {
    id: 'sorry-bro',
    name: 'ผมขอโทษครับพี่',
    emoji: '😅',
    color: '#64748b',
    url: '/sfx/sorry-bro.mp3',
    source: 'https://www.myinstants.com/en/instant/phmkh-othskhrabphii-55011/',
  },
  {
    id: 'what',
    name: 'วอทซ์',
    emoji: '🤨',
    color: '#14b8a6',
    url: '/sfx/what.mp3',
    source: 'https://www.myinstants.com/en/instant/w-thch-90812/',
  },
  {
    id: 'victory',
    name: 'Victory Royale',
    emoji: '🏆',
    color: '#f59e0b',
    url: '/sfx/victory.mp3',
    source: 'Fortnite / PUBG',
  },
]

export function findRemoteSfx(id: string) {
  return REMOTE_SFX.find((item) => item.id === id)
}
