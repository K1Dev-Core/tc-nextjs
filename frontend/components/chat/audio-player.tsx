'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { DownloadIcon } from '@/components/ui/icons'
import { formatBytes } from '@/lib/file-utils'

interface AudioPlayerProps {
  src: string
  name: string
  size?: number
  downloadName?: string
  className?: string
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function PlayIcon({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {muted || volume === 0 ? (
        <>
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </>
      ) : volume < 0.5 ? (
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  )
}

function AudioPlayerBase({ src, name, size = 0, downloadName, className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [volume, setVolume] = useState(0.9)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = muted
    audio.playbackRate = rate
  }, [volume, muted, rate])

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [src])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      try { await audio.play() } catch { void 0 }
    } else {
      audio.pause()
    }
  }, [])

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrent(value)
  }

  const cycleRate = () => setRate((r) => r === 1 ? 1.25 : r === 1.25 ? 1.5 : r === 1.5 ? 2 : 1)

  return (
    <div className={`audio-player glass-soft rounded-xl p-3 max-w-[360px] ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <div className="flex items-center gap-2 mb-2 min-w-0">
        <div className="grid place-items-center w-8 h-8 rounded-lg bg-white/8 shrink-0 text-white/70">♪</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-white/90 truncate">{name}</div>
          {size > 0 && <div className="text-[10px] text-white/40">{formatBytes(size)}</div>}
        </div>
        <a
          href={src}
          download={downloadName ?? name}
          className="grid place-items-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/55 hover:text-white/90 transition shrink-0"
          aria-label="ดาวน์โหลดเสียง"
        >
          <DownloadIcon className="w-4 h-4" />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="grid place-items-center w-9 h-9 rounded-full bg-white/12 hover:bg-white/20 text-white transition shrink-0"
          aria-label={playing ? 'หยุด' : 'เล่น'}
        >
          <PlayIcon playing={playing} />
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(current, duration || current)}
            onChange={(e) => seek(Number(e.target.value))}
            className="audio-range w-full"
            aria-label="ตำแหน่งเสียง"
          />
          <div className="flex justify-between text-[10px] text-white/40 tabular-nums mt-0.5">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className="grid place-items-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/55 hover:text-white/90 transition shrink-0"
          aria-label="เปิดปิดเสียง"
        >
          <VolumeIcon muted={muted} volume={volume} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => { setMuted(false); setVolume(Number(e.target.value)) }}
          className="audio-range flex-1"
          aria-label="ระดับเสียง"
        />
        <button
          type="button"
          onClick={cycleRate}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/55 hover:text-white/90 transition tabular-nums shrink-0"
        >
          {rate}x
        </button>
      </div>
    </div>
  )
}

export const AudioPlayer = memo(AudioPlayerBase)
