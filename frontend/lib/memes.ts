export interface MemeTemplate {
  id: string
  name: string
  tags: string[]
  url: string
  animated?: boolean
}

const IMGFLIP = 'https://i.imgflip.com'

export const MEME_TEMPLATES: MemeTemplate[] = [
  { id: 'drake', name: 'Drake Hotline Bling', tags: ['drake', 'no yes', 'reject choose'], url: `${IMGFLIP}/30b1gx.jpg` },
  { id: 'distracted', name: 'Distracted Boyfriend', tags: ['boyfriend', 'girl', 'choice'], url: `${IMGFLIP}/1ur9b0.jpg` },
  { id: 'twobuttons', name: 'Two Buttons', tags: ['buttons', 'decision', 'sweat'], url: `${IMGFLIP}/1g8my4.jpg` },
  { id: 'change', name: 'Change My Mind', tags: ['change my mind', 'table', 'opinion'], url: `${IMGFLIP}/24y43o.jpg` },
  { id: 'exit', name: 'Left Exit 12 Off Ramp', tags: ['exit', 'car', 'turn'], url: `${IMGFLIP}/22bdq6.jpg` },
  { id: 'expanding', name: 'Expanding Brain', tags: ['brain', 'galaxy', 'smart'], url: `${IMGFLIP}/1jwhww.jpg` },
  { id: 'doge', name: 'Doge', tags: ['doge', 'dog', 'wow'], url: `${IMGFLIP}/4t0m5.jpg` },
  { id: 'fine', name: 'This Is Fine', tags: ['fine', 'fire', 'dog'], url: `${IMGFLIP}/26am.jpg` },
  { id: 'success', name: 'Success Kid', tags: ['success', 'kid', 'win'], url: `${IMGFLIP}/1bhk.jpg` },
  { id: 'badluck', name: 'Bad Luck Brian', tags: ['bad luck', 'brian', 'fail'], url: `${IMGFLIP}/1bip.jpg` },
  { id: 'aliens', name: 'Ancient Aliens', tags: ['aliens', 'history', 'theory'], url: `${IMGFLIP}/26am.jpg` },
  { id: 'gru', name: 'Gru Plan', tags: ['gru', 'plan', 'mistake'], url: `${IMGFLIP}/26jxvz.jpg` },
  { id: 'stonks', name: 'Stonks', tags: ['stonks', 'profit', 'money'], url: `${IMGFLIP}/37t1lk.jpg` },
  { id: 'surprised', name: 'Surprised Pikachu', tags: ['pikachu', 'surprised', 'shock'], url: `${IMGFLIP}/2kbn1e.jpg` },
  { id: 'woman-cat', name: 'Woman Yelling At Cat', tags: ['cat', 'woman', 'argument'], url: `${IMGFLIP}/345v97.jpg` },
  { id: 'spongebob', name: 'Mocking SpongeBob', tags: ['spongebob', 'mocking', 'sarcasm'], url: `${IMGFLIP}/1otk96.jpg` },
  { id: 'rollsafe', name: 'Roll Safe', tags: ['smart', 'thinking', 'roll safe'], url: `${IMGFLIP}/1h7in3.jpg` },
  { id: 'uno', name: 'UNO Draw 25', tags: ['uno', 'card', 'choice'], url: `${IMGFLIP}/3lmzyx.jpg` },
  { id: 'panik', name: 'Panik Kalm Panik', tags: ['panik', 'kalm', 'panic'], url: `${IMGFLIP}/3qqcim.jpg` },
  { id: 'trade', name: 'Trade Offer', tags: ['trade offer', 'deal', 'exchange'], url: `${IMGFLIP}/54hjww.jpg` },
  { id: 'always', name: 'Always Has Been', tags: ['astronaut', 'always has been', 'space'], url: `${IMGFLIP}/46e43q.png` },
  { id: 'think', name: 'Think Mark', tags: ['think', 'mark', 'invincible'], url: `${IMGFLIP}/5c7lwq.png` },
  { id: 'bonk', name: 'Bonk Doge', tags: ['bonk', 'doge', 'hit'], url: `${IMGFLIP}/4acd7j.png` },
  { id: 'crying-cat', name: 'Crying Cat', tags: ['cat', 'crying', 'sad'], url: `${IMGFLIP}/2wifvo.jpg` },
  { id: 'one-does-not', name: 'One Does Not Simply', tags: ['lord rings', 'simply', 'boromir'], url: `${IMGFLIP}/1bij.jpg` },
  { id: 'yuno', name: 'Y U No', tags: ['y u no', 'rage'], url: `${IMGFLIP}/1bh3.jpg` },
  { id: 'futurama', name: 'Futurama Fry', tags: ['fry', 'not sure', 'futurama'], url: `${IMGFLIP}/1bgw.jpg` },
  { id: 'most-interesting', name: 'Most Interesting Man', tags: ['interesting', 'man'], url: `${IMGFLIP}/1bh8.jpg` },
  { id: 'philosoraptor', name: 'Philosoraptor', tags: ['philosophy', 'dinosaur'], url: `${IMGFLIP}/1bgs.jpg` },
  { id: 'oprah', name: 'Oprah You Get A', tags: ['oprah', 'everyone gets'], url: `${IMGFLIP}/gtj5t.jpg` },
  { id: 'batman', name: 'Batman Slapping Robin', tags: ['batman', 'slap', 'robin'], url: `${IMGFLIP}/9ehk.jpg` },
  { id: 'boardroom', name: 'Boardroom Meeting Suggestion', tags: ['boardroom', 'meeting'], url: `${IMGFLIP}/m78d.jpg` },
  { id: 'buzz', name: 'X Everywhere', tags: ['buzz', 'everywhere'], url: `${IMGFLIP}/1ihzfe.jpg` },
  { id: 'mocking', name: 'Mocking SpongeBob', tags: ['mocking', 'spongebob'], url: `${IMGFLIP}/1otk96.jpg` },
  { id: 'waiting', name: 'Waiting Skeleton', tags: ['waiting', 'skeleton'], url: `${IMGFLIP}/2fm6x.jpg` },
  { id: 'sad-pablo', name: 'Sad Pablo Escobar', tags: ['sad', 'waiting', 'pablo'], url: `${IMGFLIP}/1c1uej.jpg` },
  { id: 'bike-fall', name: 'Bike Fall', tags: ['bike', 'fall', 'own fault'], url: `${IMGFLIP}/1b42wl.jpg` },
  { id: 'scroll', name: 'Hard To Swallow Pills', tags: ['pills', 'truth'], url: `${IMGFLIP}/271ps6.jpg` },
  { id: 'npc', name: 'NPC Wojak', tags: ['npc', 'wojak'], url: `${IMGFLIP}/2gnnjh.jpg` },
  { id: 'clown', name: 'Clown Applying Makeup', tags: ['clown', 'makeup'], url: `${IMGFLIP}/38el31.jpg` },
  { id: 'handshake', name: 'Epic Handshake', tags: ['handshake', 'agreement'], url: `${IMGFLIP}/28j0te.jpg` },
  { id: 'awkward', name: 'Awkward Look Monkey Puppet', tags: ['monkey', 'awkward'], url: `${IMGFLIP}/2gnnjh.jpg` },
]

export const GIF_MEMES: MemeTemplate[] = [
  { id: 'gif-noice', name: 'Noice', tags: ['nice', 'noice', 'reaction'], url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', animated: true },
  { id: 'gif-mind-blown', name: 'Mind Blown', tags: ['mind blown', 'wow', 'shock'], url: 'https://media.giphy.com/media/Um3ljJl8jrnHy/giphy.gif', animated: true },
  { id: 'gif-facepalm', name: 'Facepalm', tags: ['facepalm', 'fail'], url: 'https://media.giphy.com/media/3xz2BLBOt13X9AgjEA/giphy.gif', animated: true },
  { id: 'gif-popcorn', name: 'Popcorn', tags: ['popcorn', 'watching'], url: 'https://media.giphy.com/media/pUeXcg80cO8I8/giphy.gif', animated: true },
  { id: 'gif-typing', name: 'Typing Fast', tags: ['typing', 'keyboard'], url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', animated: true },
  { id: 'gif-catjam', name: 'Cat Jam', tags: ['cat', 'jam', 'dance'], url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif', animated: true },
  { id: 'gif-confused', name: 'Confused', tags: ['confused', 'what'], url: 'https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/giphy.gif', animated: true },
  { id: 'gif-thumbs-up', name: 'Thumbs Up', tags: ['thumbs up', 'ok', 'approve'], url: 'https://media.giphy.com/media/GCvktC0KFy9l6/giphy.gif', animated: true },
  { id: 'gif-crying', name: 'Crying', tags: ['crying', 'sad'], url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif', animated: true },
  { id: 'gif-laugh', name: 'Laughing', tags: ['laugh', 'lol'], url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif', animated: true },
]


export function searchMemes(query: string): MemeTemplate[] {
  const q = query.trim().toLowerCase()
  const pool = [...GIF_MEMES, ...MEME_TEMPLATES]
  if (!q) return pool
  return pool.filter((m) => `${m.name} ${m.tags.join(' ')}`.toLowerCase().includes(q))
}
