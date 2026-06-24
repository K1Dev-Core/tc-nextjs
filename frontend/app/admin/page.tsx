'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/lib/room'
import { PigeonMark } from '@/components/ui/pigeon-mark'

type Tab = 'dashboard' | 'users' | 'channels' | 'messages'

interface Stats { online: number; totalMessages: number; totalUsers: number; totalChannels: number }
interface AdminUser { username: string; last_seen: string; message_count: number; avatar: string | null }
interface AdminChannel { id: number; name: string; description: string | null; created_at: string }
interface AdminMessage { id: number; username: string; content: string; channel_name: string; created_at: string; file_json: string | null }

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [channels, setChannels] = useState<AdminChannel[]>([])
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [msgTotal, setMsgTotal] = useState(0)
  const [msgPage, setMsgPage] = useState(0)
  const [msgSearch, setMsgSearch] = useState('')
  const [msgChannel, setMsgChannel] = useState('')
  const [loading, setLoading] = useState(false)
  const [newChName, setNewChName] = useState('')
  const [newChDesc, setNewChDesc] = useState('')
  const [editCh, setEditCh] = useState<AdminChannel | null>(null)

  const api = useCallback(async (url: string, opts?: RequestInit) => {
    try {
      const res = await fetch(`${API_BASE}/admin${url}`, {
        ...opts,
        headers: { ...opts?.headers, 'x-admin-key': token, 'Content-Type': 'application/json' },
      })
      return res.ok ? res.json() : null
    } catch { return null }
  }, [token])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(false)
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) { setToken(data.key); setAuthed(true) }
      else setLoginError(true)
    } catch { setLoginError(true) }
    setLoginLoading(false)
  }

  const loadStats = useCallback(async () => {
    const d = await api('/stats')
    if (d) setStats(d)
  }, [api])

  const loadUsers = useCallback(async () => {
    const d = await api('/users')
    if (d) setUsers(d.users)
  }, [api])

  const loadChannels = useCallback(async () => {
    const d = await api('/channels')
    if (d) setChannels(d.channels)
  }, [api])

  const loadMessages = useCallback(async (search?: string, channel?: string, page?: number) => {
    const s = search ?? msgSearch
    const c = channel ?? msgChannel
    const p = page ?? msgPage
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (c) params.set('channel', c)
    params.set('page', String(p))
    const d = await api(`/messages?${params}`)
    if (d) { setMessages(d.messages); setMsgTotal(d.total) }
  }, [api, msgSearch, msgChannel, msgPage])

  const loadAll = useCallback(() => {
    setLoading(true)
    Promise.all([loadStats(), loadUsers(), loadChannels(), loadMessages()]).finally(() => setLoading(false))
  }, [loadStats, loadUsers, loadChannels, loadMessages])

  useEffect(() => { if (authed) loadAll() }, [authed])

  if (!authed) {
    return (
      <div className="h-[100dvh] w-screen grid place-items-center p-4">
        <div className="absolute inset-0 bg-[#14161e]" />
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.15), transparent 60%)' }} />
        <form onSubmit={login} className="glass rounded-3xl w-full max-w-sm p-7 animate-slidein relative">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/8 border border-white/10 overflow-hidden mb-3">
              <PigeonMark size={32} className="text-white/90" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white/90">นกพิราบ · แอดมิน</h1>
            <p className="text-xs text-white/45 mt-1">กรอกรหัสผ่านเพื่อเข้าสู่ระบบ</p>
          </div>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLoginError(false) }}
            placeholder="รหัสผ่าน"
            className="w-full glass-soft rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 transition mb-4"
          />
          {loginError && <div className="text-xs text-red-400 text-center mb-4">รหัสผ่านไม่ถูกต้อง</div>}
          <button type="submit" disabled={!password || loginLoading} className="w-full rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 transition py-3 text-sm font-medium">
            {loginLoading ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
      </svg>
    ) },
    { id: 'users', label: 'ผู้ใช้', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ) },
    { id: 'channels', label: 'ห้อง', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ) },
    { id: 'messages', label: 'ข้อความ', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ) },
  ]

  return (
    <div className="min-h-[100dvh] w-screen bg-[#14161e] text-white/90">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-white/8 border border-white/10 overflow-hidden">
              <PigeonMark size={18} className="text-white/90" />
            </div>
            <span className="font-bold text-sm">นกพิราบ · แอดมิน</span>
            {loading && <span className="text-[10px] text-white/30 animate-pulse ml-2">กำลังโหลด…</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="text-xs text-white/40 hover:text-white/80 transition px-2 py-1 rounded-lg hover:bg-white/5">
              {loading ? '…' : 'รีเฟรชทั้งหมด'}
            </button>
            <button onClick={() => setAuthed(false)} className="text-xs text-white/40 hover:text-red-300 transition">ออกจากระบบ</button>
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-10 border-b border-white/8 bg-[#14161e]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto scroll-slim">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs whitespace-nowrap transition border-b-2
                ${tab === t.id ? 'border-emerald-400/60 text-white/90' : 'border-transparent text-white/40 hover:text-white/70'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <Dashboard stats={stats} loading={loading} />}
        {tab === 'users' && <UsersTab users={users} api={api} onRefresh={loadUsers} />}
        {tab === 'channels' && <ChannelsTab channels={channels} api={api} onRefresh={loadChannels}
          newName={newChName} setNewName={setNewChName}
          newDesc={newChDesc} setNewDesc={setNewChDesc}
          editCh={editCh} setEditCh={setEditCh}
        />}
        {tab === 'messages' && <MessagesTab messages={messages} total={msgTotal} page={msgPage}
          search={msgSearch} setSearch={setMsgSearch}
          channel={msgChannel} setChannel={setMsgChannel}
          setPage={setMsgPage}
          channels={channels} api={api} onRefresh={loadMessages}
        />}
      </main>
    </div>
  )
}

function Dashboard({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const cards = [
    { label: 'ออนไลน์', value: stats?.online ?? '—', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      </svg>
    ) },
    { label: 'ผู้ใช้ทั้งหมด', value: stats?.totalUsers ?? '—', color: 'text-sky-400', bg: 'bg-sky-400/10', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ) },
    { label: 'ข้อความ', value: stats?.totalMessages ?? '—', color: 'text-violet-400', bg: 'bg-violet-400/10', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ) },
    { label: 'ห้อง', value: stats?.totalChannels ?? '—', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ) },
  ]

  return (
    <div>
      <h2 className="text-sm font-semibold text-white/70 mb-4">ภาพรวมระบบ</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5 relative overflow-hidden">
            <div className={`grid place-items-center w-10 h-10 rounded-xl ${c.bg} ${c.color} mb-3`}>
              {c.icon}
            </div>
            <div className="text-2xl font-bold tracking-tight">{c.value}</div>
            <div className="text-xs text-white/45 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersTab({ users, api, onRefresh }: { users: AdminUser[]; api: any; onRefresh: () => void }) {
  const [confirm, setConfirm] = useState<string | null>(null)

  const del = async (username: string, deleteMessages: boolean) => {
    await api('/users/delete', { method: 'POST', body: JSON.stringify({ username, deleteMessages }) })
    setConfirm(null)
    onRefresh()
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-white/70 mb-4">ผู้ใช้ ({users.length})</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.username} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 flex items-center gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-white/8 border border-white/10 shrink-0 text-xs font-bold text-white/60">
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{u.username}</div>
                <div className="text-xs text-white/40">
                  {u.message_count} ข้อความ · ล่าสุด {u.last_seen ? new Date(u.last_seen + 'Z').toLocaleDateString('th-TH') : '-'}
                </div>
              </div>
            </div>
            {confirm === u.username ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => del(u.username, true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition whitespace-nowrap">ลบทั้งหมด</button>
                <button onClick={() => del(u.username, false)} className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition whitespace-nowrap">เฉพาะผู้ใช้</button>
                <button onClick={() => setConfirm(null)} className="text-xs px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white/70 transition">ยกเลิก</button>
              </div>
            ) : (
              <button onClick={() => setConfirm(u.username)} className="text-xs px-3 py-1.5 rounded-lg text-red-300/80 hover:bg-red-500/15 transition shrink-0">ลบ</button>
            )}
          </div>
        ))}
        {users.length === 0 && <div className="text-center text-white/35 py-12 text-sm">ไม่มีผู้ใช้</div>}
      </div>
    </div>
  )
}

function ChannelsTab({ channels, api, onRefresh, newName, setNewName, newDesc, setNewDesc, editCh, setEditCh }: {
  channels: AdminChannel[]; api: any; onRefresh: () => void
  newName: string; setNewName: (v: string) => void
  newDesc: string; setNewDesc: (v: string) => void
  editCh: AdminChannel | null; setEditCh: (v: AdminChannel | null) => void
}) {
  const [delConfirm, setDelConfirm] = useState<number | null>(null)

  const create = async () => {
    if (!newName.trim()) return
    await api('/channels', { method: 'POST', body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }) })
    setNewName(''); setNewDesc('')
    onRefresh()
  }

  const update = async () => {
    if (!editCh || !editCh.name.trim()) return
    await api('/channels', { method: 'PUT', body: JSON.stringify(editCh) })
    setEditCh(null)
    onRefresh()
  }

  const del = async (id: number) => {
    await api('/channels/delete', { method: 'POST', body: JSON.stringify({ id }) })
    setDelConfirm(null)
    onRefresh()
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-white/70 mb-4">ห้อง ({channels.length})</h2>

      <div className="glass rounded-xl p-4 mb-6">
        <div className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          สร้างห้องใหม่
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ชื่อห้อง" maxLength={50}
            className="flex-1 glass-soft rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-white/15" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="คำอธิบาย (ไม่จำเป็น)" maxLength={200}
            className="flex-1 glass-soft rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-white/15" />
          <button onClick={create} disabled={!newName.trim()}
            className="px-4 py-2 rounded-xl bg-white/15 text-xs font-medium hover:bg-white/25 disabled:opacity-40 transition shrink-0">สร้าง</button>
        </div>
      </div>

      {editCh && (
        <div className="glass rounded-xl p-4 mb-6 border border-emerald-400/20">
          <div className="text-xs font-medium text-emerald-300/80 mb-3">แก้ไขห้อง</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={editCh.name} onChange={(e) => setEditCh({ ...editCh, name: e.target.value })} placeholder="ชื่อห้อง" maxLength={50}
              className="flex-1 glass-soft rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-400/20" />
            <input value={editCh.description ?? ''} onChange={(e) => setEditCh({ ...editCh, description: e.target.value || null })} placeholder="คำอธิบาย"
              className="flex-1 glass-soft rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-emerald-400/20" />
            <button onClick={update} disabled={!editCh.name.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 disabled:opacity-40 transition">บันทึก</button>
            <button onClick={() => setEditCh(null)}
              className="px-4 py-2 rounded-xl text-white/40 hover:text-white/70 text-xs transition">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {channels.map((ch) => (
          <div key={ch.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{ch.name}</div>
              {ch.description && <div className="text-xs text-white/40 truncate mt-0.5">{ch.description}</div>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setEditCh(ch)} className="text-xs px-2.5 py-1.5 rounded-lg text-white/50 hover:bg-white/10 transition">แก้ไข</button>
              {delConfirm === ch.id ? (
                <>
                  <button onClick={() => del(ch.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">ยืนยันลบ</button>
                  <button onClick={() => setDelConfirm(null)} className="text-xs px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white/70 transition">ยกเลิก</button>
                </>
              ) : (
                <button onClick={() => setDelConfirm(ch.id)} className="text-xs px-2.5 py-1.5 rounded-lg text-red-300/80 hover:bg-red-500/15 transition">ลบ</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagesTab({ messages, total, page, search, setSearch, channel, setChannel, setPage, channels, api, onRefresh }: {
  messages: AdminMessage[]; total: number; page: number
  search: string; setSearch: (v: string) => void
  channel: string; setChannel: (v: string) => void
  setPage: (v: number) => void
  channels: AdminChannel[]; api: any; onRefresh: (...args: any[]) => void
}) {
  const [delId, setDelId] = useState<number | null>(null)

  const doSearch = () => { setPage(0); onRefresh(search, channel, 0) }
  const del = async (id: number) => {
    await api('/messages/delete', { method: 'POST', body: JSON.stringify({ id }) })
    setDelId(null)
    onRefresh()
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <h2 className="text-sm font-semibold text-white/70 mb-4">ข้อความทั้งหมด ({total})</h2>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="ค้นหาข้อความ…"
            className="flex-1 glass-soft rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-white/15" />
          <select value={channel} onChange={(e) => { setChannel(e.target.value); setPage(0) }}
            className="glass-soft rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-white/15 min-w-[100px]">
            <option value="">ทุกห้อง</option>
            {channels.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={doSearch} className="px-4 py-2 rounded-xl bg-white/15 text-xs font-medium hover:bg-white/25 transition shrink-0">ค้นหา</button>
      </div>

      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="glass rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-white/80">{m.username}</span>
                  <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5">{m.channel_name}</span>
                  <span className="text-[10px] text-white/25">{new Date(m.created_at + 'Z').toLocaleString('th-TH')}</span>
                </div>
                <div className="text-xs text-white/60 whitespace-pre-wrap break-words line-clamp-3">
                  {m.content || (m.file_json ? '📎 ไฟล์แนบ' : '(ว่าง)')}
                </div>
              </div>
              {delId === m.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => del(m.id)} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">ยืนยัน</button>
                  <button onClick={() => setDelId(null)} className="text-xs px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white/70 transition">ยกเลิก</button>
                </div>
              ) : (
                <button onClick={() => setDelId(m.id)} className="text-xs px-2.5 py-1.5 rounded-lg text-red-300/80 hover:bg-red-500/15 transition shrink-0">ลบ</button>
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="text-center text-white/35 py-12 text-sm">ไม่มีข้อความ</div>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => { const p = Math.max(0, page - 1); setPage(p); onRefresh(search, channel, p) }}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 disabled:opacity-30 transition">ก่อนหน้า</button>
          <span className="text-xs text-white/40">หน้า {page + 1} / {totalPages}</span>
          <button onClick={() => { const p = Math.min(totalPages - 1, page + 1); setPage(p); onRefresh(search, channel, p) }}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 disabled:opacity-30 transition">ถัดไป</button>
        </div>
      )}
    </div>
  )
}
