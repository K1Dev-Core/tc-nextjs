export type MessageType =
  | 'message' | 'join' | 'leave' | 'users' | 'history' | 'typing'
  | 'channels' | 'channel_switch' | 'channel_created'
  | 'reply' | 'react' | 'unreact' | 'reaction_update'

export interface FileMeta {
  url: string
  name: string
  type: string
  size: number
}

export interface ChannelInfo {
  id: number
  name: string
  description: string | null
}

export interface ReactionInfo {
  emoji: string
  users: string[]
}

export interface ChatMessage {
  type: MessageType
  id?: number
  channel?: string
  username: string
  content?: string
  file?: FileMeta
  timestamp: string
  users?: string[]
  history?: ChatMessage[]
  channels?: ChannelInfo[]
  replyTo?: number
  replyToContent?: string
  replyToUsername?: string
  emoji?: string
  reactions?: ReactionInfo[]
}

export interface LineMessage {
  id: string
  dbId?: number
  type: 'message' | 'system'
  username: string
  content: string
  file?: FileMeta
  timestamp: string
  mine: boolean
  replyTo?: number
  replyToContent?: string
  replyToUsername?: string
  reactions?: ReactionInfo[]
}
