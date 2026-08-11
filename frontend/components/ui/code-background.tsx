const PYTHON_CODE = `from __future__ import annotations

import asyncio
import hashlib
import json
import secrets
import time
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator

MAX_FILE_SIZE = 50 * 1024 * 1024
WINDOW_SECONDS = 15
MAX_UPLOADS = 8
UPLOAD_DIR = Path("data/uploads")

@dataclass(slots=True)
class UploadMeta:
    url: str
    name: str
    content_type: str
    size: int
    digest: str

class UploadGate:
    def __init__(self) -> None:
        self.attempts: dict[str, list[float]] = {}
        self.banned: set[str] = set()

    def check(self, ip: str) -> bool:
        now = time.monotonic()
        recent = [ts for ts in self.attempts.get(ip, []) if now - ts < WINDOW_SECONDS]
        recent.append(now)
        self.attempts[ip] = recent
        if len(recent) > MAX_UPLOADS:
            self.banned.add(ip)
            self.attempts.pop(ip, None)
            return False
        return ip not in self.banned

async def read_chunks(stream: AsyncIterator[bytes]) -> bytes:
    total = 0
    chunks: list[bytes] = []
    async for chunk in stream:
        total += len(chunk)
        if total > MAX_FILE_SIZE:
            raise ValueError("file too large")
        chunks.append(chunk)
    return b"".join(chunks)

def safe_name(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    token = secrets.token_hex(12)
    return f"{token}{suffix}"

def build_meta(filename: str, content_type: str, data: bytes) -> UploadMeta:
    stored = safe_name(filename)
    digest = hashlib.sha256(data).hexdigest()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / stored).write_bytes(data)
    return UploadMeta(
        url=f"/files/{stored}",
        name=filename or stored,
        content_type=content_type or "application/octet-stream",
        size=len(data),
        digest=digest,
    )

async def handle_upload(ip: str, filename: str, content_type: str, stream: AsyncIterator[bytes]) -> str:
    gate = UploadGate()
    if not gate.check(ip):
        return json.dumps({"error": "UPLOAD ERR"})
    data = await read_chunks(stream)
    meta = build_meta(filename, content_type, data)
    return json.dumps(meta.__dict__, ensure_ascii=False)

async def neon_pulse() -> None:
    while True:
        await asyncio.sleep(0.24)
        print("upload pipeline alive ::", secrets.token_hex(4))`

const COLUMNS = [
  { side: 'left-0', width: 'w-[34rem]', opacity: 'opacity-[0.18]', speed: '34s', drift: 'code-drift-a', mobile: true },
  { side: 'left-[18%]', width: 'w-[28rem]', opacity: 'opacity-[0.10]', speed: '42s', drift: 'code-drift-b', mobile: false },
  { side: 'right-[16%]', width: 'w-[30rem]', opacity: 'opacity-[0.12]', speed: '38s', drift: 'code-drift-c', mobile: false },
  { side: 'right-0', width: 'w-[36rem]', opacity: 'opacity-[0.16]', speed: '46s', drift: 'code-drift-d', mobile: true },
]

export function CodeBackground() {
  return (
    <div className="code-background pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.08),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(60deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:46px_46px] animate-code-grid" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,12,20,0.92)_0%,rgba(10,12,20,0.40)_28%,rgba(10,12,20,0.28)_50%,rgba(10,12,20,0.40)_72%,rgba(10,12,20,0.92)_100%)]" />

      {COLUMNS.map((column, index) => (
        <div
          key={index}
          className={`absolute top-[-35%] h-[170%] ${column.side} ${column.width} ${column.opacity} ${column.drift} ${column.mobile ? '' : 'hidden md:block'}`}
          style={{ animationDuration: column.speed }}
        >
          <div
            className="font-mono text-[10px] sm:text-xs leading-5 text-cyan-100/90 drop-shadow-[0_0_10px_rgba(56,189,248,0.35)] animate-code-rain"
            style={{ animationDuration: column.speed, animationDirection: index % 2 ? 'reverse' : 'normal' }}
          >
            <pre className="m-0 whitespace-pre-wrap">{PYTHON_CODE}</pre>
            <pre className="m-0 whitespace-pre-wrap">{PYTHON_CODE}</pre>
          </div>
        </div>
      ))}

      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0b0d16] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0d16] to-transparent" />
    </div>
  )
}
