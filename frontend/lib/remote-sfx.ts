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
  {
    id: '2-tlktbmuk-2-4985',
    name: '2_ตลกตบมุก_2',
    emoji: '🔊',
    color: '#ef4444',
    url: '/sfx/2-tlktbmuk-2-4985.mp3',
    source: 'myinstants',
  },
  {
    id: 'fahhhhhhhhhhhhhh-3525',
    name: 'FAHHHHHHHHHHHHHH',
    emoji: '🔊',
    color: '#f97316',
    url: '/sfx/fahhhhhhhhhhhhhh-3525.mp3',
    source: 'myinstants',
  },
  {
    id: 'vine-boom-sound-70972',
    name: 'VINE BOOM SOUND',
    emoji: '🔊',
    color: '#eab308',
    url: '/sfx/vine-boom-sound-70972.mp3',
    source: 'myinstants',
  },
  {
    id: 'diitebtaaethset-r-75342',
    name: 'อดีตเบต้าเทสเตอร์',
    emoji: '🔊',
    color: '#22c55e',
    url: '/sfx/diitebtaaethset-r-75342.mp3',
    source: 'myinstants',
  },
  {
    id: 'esiiyngnaakh-m-w-92941',
    name: 'เสียงน้าค้อม =w=',
    emoji: '🔊',
    color: '#14b8a6',
    url: '/sfx/esiiyngnaakh-m-w-92941.mp3',
    source: 'myinstants',
  },
  {
    id: 'rizz-sound-effect-54189',
    name: 'rizz sound effect',
    emoji: '🔊',
    color: '#0ea5e9',
    url: '/sfx/rizz-sound-effect-54189.mp3',
    source: 'myinstants',
  },
  {
    id: 'aimaihwaelw-95567',
    name: 'ไม่ไหวแล้ว',
    emoji: '🔊',
    color: '#6366f1',
    url: '/sfx/aimaihwaelw-95567.mp3',
    source: 'myinstants',
  },
  {
    id: 'among-us-role-reveal-sound-34956',
    name: 'Among Us role reveal sound',
    emoji: '🔊',
    color: '#a855f7',
    url: '/sfx/among-us-role-reveal-sound-34956.mp3',
    source: 'myinstants',
  },
  {
    id: 'ack-87763',
    name: 'ACK',
    emoji: '🔊',
    color: '#ec4899',
    url: '/sfx/ack-87763.mp3',
    source: 'myinstants',
  },
  {
    id: 'anime-wow',
    name: 'Anime Wow',
    emoji: '🔊',
    color: '#f43f5e',
    url: '/sfx/anime-wow.mp3',
    source: 'myinstants',
  },
  {
    id: 'sngsay-31492',
    name: 'สงสัย',
    emoji: '🔊',
    color: '#f59e0b',
    url: '/sfx/sngsay-31492.mp3',
    source: 'myinstants',
  },
  {
    id: 'esiiyngnaakh-m-w-4-16142',
    name: 'เสียงน้าค้อม =w= 4',
    emoji: '🔊',
    color: '#78716c',
    url: '/sfx/esiiyngnaakh-m-w-4-16142.mp3',
    source: 'myinstants',
  },
  {
    id: 'tununuuuu-67224',
    name: 'Tununuuuu',
    emoji: '🔊',
    color: '#10b981',
    url: '/sfx/tununuuuu-67224.mp3',
    source: 'myinstants',
  },
  {
    id: 'spiderman-meme-song-37638',
    name: 'spiderman meme song',
    emoji: '🔊',
    color: '#38bdf8',
    url: '/sfx/spiderman-meme-song-37638.mp3',
    source: 'myinstants',
  },
  {
    id: 'wing-27818',
    name: 'วิ้ง',
    emoji: '🔊',
    color: '#e879f9',
    url: '/sfx/wing-27818.mp3',
    source: 'myinstants',
  },
  {
    id: 'thuukt-ng-83135',
    name: 'ถูกต้อง',
    emoji: '🔊',
    color: '#f97316',
    url: '/sfx/thuukt-ng-83135.mp3',
    source: 'myinstants',
  },
  {
    id: 'shocked-sound-37548',
    name: 'Shocked sound',
    emoji: '🔊',
    color: '#eab308',
    url: '/sfx/shocked-sound-37548.mp3',
    source: 'myinstants',
  },
  {
    id: 'fart',
    name: 'Fart',
    emoji: '🔊',
    color: '#84cc16',
    url: '/sfx/fart.mp3',
    source: 'myinstants',
  },
  {
    id: 'wuued-luuen-5465',
    name: 'วื๊ด ลื่น',
    emoji: '🔊',
    color: '#22c55e',
    url: '/sfx/wuued-luuen-5465.mp3',
    source: 'myinstants',
  },
  {
    id: 'bone-crack-23901',
    name: 'Bone Crack',
    emoji: '🔊',
    color: '#14b8a6',
    url: '/sfx/bone-crack-23901.mp3',
    source: 'myinstants',
  },
  {
    id: 'phmkh-othskhrabphii-55011',
    name: 'ผมขอโทษครับพี่',
    emoji: '🔊',
    color: '#0ea5e9',
    url: '/sfx/phmkh-othskhrabphii-55011.mp3',
    source: 'myinstants',
  },
  {
    id: 'dexter-meme-26140',
    name: 'Dexter meme',
    emoji: '🔊',
    color: '#6366f1',
    url: '/sfx/dexter-meme-26140.mp3',
    source: 'myinstants',
  },
  {
    id: 'error-soundss-25534',
    name: 'Error SOUNDSS',
    emoji: '🔊',
    color: '#a855f7',
    url: '/sfx/error-soundss-25534.mp3',
    source: 'myinstants',
  },
  {
    id: 'singsakdisiththi-1158',
    name: 'สิ่งศักดิ์สิทธิ์ๆๆๆๆ',
    emoji: '🔊',
    color: '#ec4899',
    url: '/sfx/singsakdisiththi-1158.mp3',
    source: 'myinstants',
  },
  {
    id: 'dukdik-13562',
    name: 'ดุ๊กดิ๊ก',
    emoji: '🔊',
    color: '#f43f5e',
    url: '/sfx/dukdik-13562.mp3',
    source: 'myinstants',
  },
  {
    id: 'cchae-tawe-ng-34216',
    name: 'จ๊ะเอ๋ตัวเอง',
    emoji: '🔊',
    color: '#f59e0b',
    url: '/sfx/cchae-tawe-ng-34216.mp3',
    source: 'myinstants',
  },
  {
    id: 'ebrkhmuk-74707',
    name: 'เบรคมุก',
    emoji: '🔊',
    color: '#78716c',
    url: '/sfx/ebrkhmuk-74707.mp3',
    source: 'myinstants',
  },
  {
    id: 'indian-song-26519',
    name: 'indian song',
    emoji: '🔊',
    color: '#10b981',
    url: '/sfx/indian-song-26519.mp3',
    source: 'myinstants',
  },
  {
    id: 'tuengopa-471',
    name: 'ตึงโป๊ะๆ',
    emoji: '🔊',
    color: '#38bdf8',
    url: '/sfx/tuengopa-471.mp3',
    source: 'myinstants',
  },
  {
    id: 'anime-ahh-73606',
    name: 'anime ahh',
    emoji: '🔊',
    color: '#e879f9',
    url: '/sfx/anime-ahh-73606.mp3',
    source: 'myinstants',
  },
  {
    id: 'fahhh-42300',
    name: 'Fahhh',
    emoji: '🔊',
    color: '#ef4444',
    url: '/sfx/fahhh-42300.mp3',
    source: 'myinstants',
  },
  {
    id: 'huh-ceeday-65118',
    name: 'Huh? Ceeday',
    emoji: '🔊',
    color: '#f97316',
    url: '/sfx/huh-ceeday-65118.mp3',
    source: 'myinstants',
  },
  {
    id: 'eh-eh-ehhhh-30930',
    name: 'eh?eh?ehhhh?',
    emoji: '🔊',
    color: '#eab308',
    url: '/sfx/eh-eh-ehhhh-30930.mp3',
    source: 'myinstants',
  },
  {
    id: 'chicken-on-tree-screaming-53890',
    name: 'Chicken on tree screaming',
    emoji: '🔊',
    color: '#84cc16',
    url: '/sfx/chicken-on-tree-screaming-53890.mp3',
    source: 'myinstants',
  },
]

export function findRemoteSfx(id: string) {
  return REMOTE_SFX.find((item) => item.id === id)
}
