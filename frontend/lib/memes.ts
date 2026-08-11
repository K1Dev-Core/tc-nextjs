export interface MemeTemplate {
  id: string
  name: string
  tags: string[]
  url: string
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
]

export function searchMemes(query: string): MemeTemplate[] {
  const q = query.trim().toLowerCase()
  if (!q) return MEME_TEMPLATES
  return MEME_TEMPLATES.filter((m) => `${m.name} ${m.tags.join(' ')}`.toLowerCase().includes(q))
}
