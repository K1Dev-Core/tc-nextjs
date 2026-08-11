export interface RemoteSfxItem {
  id: string
  name: string
  emoji: string
  color: string
  url: string
  source: string
}

export const SFX_COOLDOWN_MS = 3500

export const REMOTE_SFX: RemoteSfxItem[] = [
  {
    id: 'sad-violin',
    name: 'Sad Violin',
    emoji: '🎻',
    color: '#f44336',
    url: 'https://www.myinstants.com/media/sounds/tf_nemesis.mp3',
    source: 'https://www.myinstants.com/en/instant/sad-violin-the-meme-one/',
  },
  {
    id: 'among-us-role',
    name: 'Among Us Reveal',
    emoji: 'ඞ',
    color: '#ff3b30',
    url: 'https://www.myinstants.com/media/sounds/among-us-role-reveal-sound.mp3',
    source: 'https://www.myinstants.com/en/instant/among-us-role-reveal-sound-34956/',
  },
  {
    id: 'shocked',
    name: 'Shocked',
    emoji: '😱',
    color: '#ff453a',
    url: 'https://www.myinstants.com/media/sounds/shocked-sound-effect.mp3',
    source: 'https://www.myinstants.com/en/instant/shocked-sound-37548/',
  },
  {
    id: 'emotional-damage',
    name: 'Emotional Damage',
    emoji: '💥',
    color: '#ff2d55',
    url: 'https://www.myinstants.com/media/sounds/emotional-damage-meme.mp3',
    source: 'https://www.myinstants.com/en/instant/emotional-damage-meme-74555/',
  },
  {
    id: 'fart',
    name: 'Fart Meme',
    emoji: '💨',
    color: '#ff6b35',
    url: 'https://www.myinstants.com/media/sounds/fart-meme-sound.mp3',
    source: 'https://www.myinstants.com/en/instant/fart-meme-sound-46799/',
  },
  {
    id: 'run-vine',
    name: 'RUN Vine',
    emoji: '🏃',
    color: '#ff9500',
    url: 'https://www.myinstants.com/media/sounds/run-vine-sound-effect.mp3',
    source: 'https://www.myinstants.com/en/instant/run-vine/',
  },
]

export function findRemoteSfx(id: string) {
  return REMOTE_SFX.find((item) => item.id === id)
}
