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
  { id: 'gif-dance', name: 'Dancing', tags: ['dance', 'party', 'groove'], url: 'https://media.giphy.com/media/l0HlBQ4BvY52pSxC0/giphy.gif', animated: true },
  { id: 'gif-thumbs-down', name: 'Thumbs Down', tags: ['thumbs down', 'no', 'dislike'], url: 'https://media.giphy.com/media/Yqo9Wz4nM0Al6/giphy.gif', animated: true },
  { id: 'gif-shocked', name: 'Shocked', tags: ['shock', 'surprise', 'wow'], url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif', animated: true },
  { id: 'gif-cat-typing', name: 'Cat Typing', tags: ['cat', 'typing', 'keyboard'], url: 'https://media.giphy.com/media/8ABn78AaQavf2/giphy.gif', animated: true },
  { id: 'gif-ok-fine', name: 'Okay Fine', tags: ['ok', 'fine', 'agree'], url: 'https://media.giphy.com/media/Rg3xJxCI1L5Ys/giphy.gif', animated: true },
  { id: 'gif-awesome', name: 'Awesome', tags: ['awesome', 'nice', 'cool'], url: 'https://media.giphy.com/media/as7AW29S7MEuE/giphy.gif', animated: true },
  { id: 'gif-rain', name: 'Rain', tags: ['rain', 'weather', 'sad'], url: 'https://media.giphy.com/media/26tPplGWSPN3xRlUI/giphy.gif', animated: true },
  { id: 'gif-hype', name: 'Hyped', tags: ['hype', 'excited', 'party'], url: 'https://media.giphy.com/media/3o7btPCcdNniCzA7x3/giphy.gif', animated: true },
  { id: 'gif-silly', name: 'Silly', tags: ['silly', 'goofy', 'fun'], url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', animated: true },
  { id: 'gif-amazing', name: 'Amazing', tags: ['amazing', 'wow', 'impress'], url: 'https://media.giphy.com/media/3og0IPxMM0erATueG/giphy.gif', animated: true },
  { id: 'gif-butterfly', name: 'Butterfly', tags: ['butterfly', 'nature', 'fly'], url: 'https://media.giphy.com/media/grydYdA6vJcae/giphy.gif', animated: true },
  { id: 'gif-dog-dance', name: 'Dog Dance', tags: ['dog', 'dance', 'party'], url: 'https://media.giphy.com/media/26gssIoh5TYKcXJ4A/giphy.gif', animated: true },
  { id: 'gif-neon', name: 'Neon Glow', tags: ['neon', 'glow', 'cool'], url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', animated: true },
  { id: 'gif-angry', name: 'Angry', tags: ['angry', 'mad', 'rage'], url: 'https://media.giphy.com/media/NLTlz5WO56sOq/giphy.gif', animated: true },
  { id: 'gif-osu', name: 'Osu', tags: ['osu', 'celebrate', 'buddy'], url: 'https://media.giphy.com/media/gLZlyXIAg2n6c/giphy.gif', animated: true },
  { id: 'gif-phone', name: 'Phone Call', tags: ['phone', 'call', 'hello'], url: 'https://media.giphy.com/media/u3nOk6IB7lm0G/giphy.gif', animated: true },
  { id: 'gif-crying-laugh', name: 'Crying Laugh', tags: ['crying', 'laugh', 'lol'], url: 'https://media.giphy.com/media/dBZ61zU4r6zlG/giphy.gif', animated: true },
  { id: 'gif-great', name: 'Great Job', tags: ['great', 'good', 'praise'], url: 'https://media.giphy.com/media/L0UkM0TNXVwE7QrEdv/giphy.gif', animated: true },
  { id: 'gif-yes', name: 'Yes!', tags: ['yes', 'win', 'celebrate'], url: 'https://media.giphy.com/media/FAiSfrArN1P8W/giphy.gif', animated: true },
  { id: 'gif-hello', name: 'Hello', tags: ['hello', 'hi', 'waves'], url: 'https://media.giphy.com/media/nSBpO9IcVCAkg/giphy.gif', animated: true },
  { id: 'gif-deal', name: 'Deal', tags: ['deal', 'shake', 'agree'], url: 'https://media.giphy.com/media/YlLrDvVdvXgTW/giphy.gif', animated: true },
  { id: 'gif-jump', name: 'Jumping', tags: ['jump', 'happy', 'excited'], url: 'https://media.giphy.com/media/kbQdFbGfY5P9W/giphy.gif', animated: true },
  { id: 'gif-kiss', name: 'Kiss', tags: ['kiss', 'love', 'heart'], url: 'https://media.giphy.com/media/3o7aD2saalBwwulI4s/giphy.gif', animated: true },
  { id: 'gif-cat-dance', name: 'Cat Dance', tags: ['cat', 'dance', 'fun'], url: 'https://media.giphy.com/media/SgSlBMnP2xjP4/giphy.gif', animated: true },
  { id: 'gif-headtilt', name: 'Head Tilt', tags: ['hmm', 'think', 'confused'], url: 'https://media.giphy.com/media/4pMXQ3Pr9ROzO/giphy.gif', animated: true },
  { id: 'gif-coffee', name: 'Coffee', tags: ['coffee', 'drink', 'morning'], url: 'https://media.giphy.com/media/v4Q7l9j6zF8zK/giphy.gif', animated: true },
  { id: 'gif-party', name: 'Party', tags: ['party', 'confetti', 'celebrate'], url: 'https://media.giphy.com/media/26ufdipQqU2lhTa4R/giphy.gif', animated: true },
  { id: 'gif-sleepy', name: 'Sleepy', tags: ['sleep', 'tired', 'yawn'], url: 'https://media.giphy.com/media/12h3G6eRkLJc5a/giphy.gif', animated: true },
  { id: 'gif-hugs', name: 'Hugs', tags: ['hug', 'cuddle', 'love'], url: 'https://media.giphy.com/media/20H7cCWYkQr4bW/giphy.gif', animated: true },
  { id: 'gif-gg', name: 'GG', tags: ['gg', 'good game', 'clap'], url: 'https://media.giphy.com/media/dEzu0jKzXbLz9O/giphy.gif', animated: true },
  { id: 'gif-deal2', name: 'Shake Deal', tags: ['deal', 'shake', 'hand'], url: 'https://media.giphy.com/media/a2P0v2yR2mw7n2/giphy.gif', animated: true },
  { id: 'gif-sing', name: 'Singing', tags: ['sing', 'song', 'mic'], url: 'https://media.giphy.com/media/O5sy1Bn1y6O9nF/giphy.gif', animated: true },
  { id: 'gif-cool', name: 'Cool', tags: ['cool', 'swag', 'sunglasses'], url: 'https://media.giphy.com/media/Uq0fXYBUpBZy7/giphy.gif', animated: true },
  { id: 'gif-love', name: 'Love Heart', tags: ['love', 'heart', 'cute'], url: 'https://media.giphy.com/media/cY8NS7H7q4mSFK/giphy.gif', animated: true },
  { id: 'gif-clap', name: 'Clapping', tags: ['clap', 'applause', 'bravo'], url: 'https://media.giphy.com/media/3oEduVv4N7lVq0/giphy.gif', animated: true },
  { id: 'gif-bow', name: 'Bow', tags: ['bow', 'respect', 'honor'], url: 'https://media.giphy.com/media/Tbi6x2FbeJgW/giphy.gif', animated: true },
]


export function searchMemes(query: string): MemeTemplate[] {
  const q = query.trim().toLowerCase()
  const pool = [...GIF_MEMES, ...MEME_TEMPLATES]
  if (!q) return pool
  return pool.filter((m) => `${m.name} ${m.tags.join(' ')}`.toLowerCase().includes(q))
}
