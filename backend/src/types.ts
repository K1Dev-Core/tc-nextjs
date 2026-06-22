export type MessageType =
  | 'message' | 'join' | 'leave' | 'typing' | 'users' | 'history'
  | 'channels' | 'channel_switch' | 'channel_created' | 'create_channel'
  | 'reply' | 'react' | 'unreact' | 'reaction_update'
  | 'pin' | 'unpin' | 'pins_update'

export interface FileMeta {
  url: string
  name: string
  type: string
  size: number
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
  channels?: { id: number; name: string; description: string | null }[]
  replyTo?: number
  replyToContent?: string
  replyToUsername?: string
  emoji?: string
  reactions?: ReactionInfo[]
  pinnedBy?: string
  pinnedAt?: string
  pins?: ChatMessage[]
}

export interface MessageRow {
  id: number
  username: string
  content: string
  file_json: string | null
  channel_id: number
  reply_to: number | null
  created_at: string
}

export interface UserRow {
  username: string
  last_seen: string
  message_count: number
}

export interface ChannelRow {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface ReactionRow {
  message_id: number
  username: string
  emoji: string
}
