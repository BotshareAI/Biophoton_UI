import { execFile, ExecFileOptions } from 'node:child_process'
import path from 'node:path'
import { app } from 'electron'

function execFileAsync(cmd: string, args: string[], opts?: ExecFileOptions): Promise<string> {
  return new Promise<string>((resolve, reject) =>
    execFile(cmd, args, opts ?? {}, (err, stdout, stderr) =>
      err ? reject(new Error(stderr || String(err))) : resolve(stdout)
    )
  )
}

function pulseEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  if (!env.XDG_RUNTIME_DIR) {
    const uid = process.getuid?.()
    if (typeof uid === 'number') env.XDG_RUNTIME_DIR = `/run/user/${uid}`
  }
  if (!env.PULSE_RUNTIME_PATH && env.XDG_RUNTIME_DIR) {
    env.PULSE_RUNTIME_PATH = `${env.XDG_RUNTIME_DIR}/pulse`
  }
  return env
}

const PACTL = '/usr/bin/pactl'
const AMIXER = '/usr/bin/amixer'

// ---------- Linux (PulseAudio / PipeWire via pactl, fallback to amixer) ----------

async function linuxSetVolume(percent: number): Promise<void> {
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  const env = pulseEnv()

  try {
    await execFileAsync(PACTL, ['set-sink-volume', '@DEFAULT_SINK@', `${p}%`], { env })
    return
  } catch (e) {
    console.warn('pactl set-sink-volume failed:', e)
  }
  // Fallback to named sink (older pactl or token unsupported)
  try {
    const sink = (await execFileAsync(PACTL, ['get-default-sink'], { env })).trim()
    if (sink) {
      await execFileAsync(PACTL, ['set-sink-volume', sink, `${p}%`], { env })
      return
    }
  } catch (e) {
    console.warn('pactl fallback (named sink) failed:', e)
  }
  // amixer fallback
  try {
    await execFileAsync(AMIXER, ['-D', 'pulse', 'sset', 'Master', `${p}%`], { env })
    return
  } catch (e) {
    console.warn('amixer set volume failed:', e)
  }
  throw new Error('No supported mixer (pactl/amixer) found')
}

async function linuxSetMute(muted: boolean): Promise<void> {
  const flag = muted ? '1' : '0'
  const env = pulseEnv()
  try {
    await execFileAsync(PACTL, ['set-sink-mute', '@DEFAULT_SINK@', flag], { env })
    return
  } catch (e) {
    console.warn('pactl set-sink-mute failed:', e)
  }
  try {
    const sink = (await execFileAsync(PACTL, ['get-default-sink'], { env })).trim()
    if (sink) {
      await execFileAsync(PACTL, ['set-sink-mute', sink, flag], { env })
      return
    }
  } catch (e) {
    console.warn('pactl fallback (named sink) failed:', e)
  }
  // amixer fallbacks for different controls
  const action = muted ? 'mute' : 'unmute'
  for (const ctl of ['Master', 'Speaker', 'Headphone', 'PCM']) {
    try {
      await execFileAsync(AMIXER, ['-D', 'pulse', 'sset', ctl, action], { env })
      return
    } catch (e) {
      console.warn('amixer failed:', e)
    }
  }
  throw new Error('No supported mixer (pactl/amixer) found')
}

async function linuxGetVolume(): Promise<number> {
  const env = pulseEnv()
  try {
    const out = await execFileAsync(PACTL, ['get-sink-volume', '@DEFAULT_SINK@'], { env })
    const m = out.match(/\/\s*(\d+)%/) // first % in the first line
    if (m) return Math.max(0, Math.min(100, parseInt(m[1], 10)))
  } catch (e) {
    console.warn('pactl get volume failed:', e)
  }
  try {
    const out = await execFileAsync(AMIXER, ['-D', 'pulse', 'get', 'Master'], { env })
    const m = out.match(/(\d+)%/)
    if (m) return Math.max(0, Math.min(100, parseInt(m[1], 10)))
  } catch (e) {
    console.warn('amixer get volume failed:', e)
  }
  throw new Error('Cannot read volume')
}

async function linuxGetMute(): Promise<boolean> {
  const env = pulseEnv()
  try {
    const out = await execFileAsync(PACTL, ['get-sink-mute', '@DEFAULT_SINK@'], { env })
    const s = String(out).trim().split(/\s+/).pop()
    if (s === 'yes' || s === 'no') return s === 'yes'
  } catch (e) {
    console.warn('pactl get-sink-mute failed:', e)
  }
  // amixer fallback
  for (const ctl of ['Master', 'Speaker', 'Headphone', 'PCM']) {
    try {
      const out = await execFileAsync(AMIXER, ['-D', 'pulse', 'get', ctl], { env })
      const m = out.match(/\[(on|off)\]/i)
      if (m) return m[1].toLowerCase() === 'off'
    } catch (e) {
      console.warn('amixer failed:', e)
    }
  }
  throw new Error('Cannot read mute state')
}

// ---------- Windows (NirCmd portable; or swap with your preferred tool) ----------
// Place nircmd.exe in resources/bin/nircmd.exe via electron-builder extraResources.

function nircmdPath(): string {
  const rel =
    process.platform === 'win32'
      ? app.isPackaged
        ? path.join(process.resourcesPath, 'bin', 'nircmd.exe')
        : path.join(process.cwd(), 'resources', 'bin', 'nircmd.exe')
      : ''
  return rel
}

async function winSetVolume(percent: number): Promise<void> {
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  const val = Math.round(p * 655.35) // 0..65535
  await execFileAsync(nircmdPath(), ['setsysvolume', String(val)])
}

async function winSetMute(muted: boolean): Promise<void> {
  await execFileAsync(nircmdPath(), ['mutesysvolume', muted ? '1' : '0'])
}

async function winGetVolume(): Promise<number> {
  const raw = await execFileAsync(nircmdPath(), ['getsysvolume'])
  const n = Number(String(raw).trim())
  if (Number.isFinite(n)) return Math.round(n / 655.35)
  throw new Error('Cannot read volume')
}

async function winGetMute(): Promise<boolean> {
  // NirCmd returns 1/0 for muted state with 'getappvolume' only; instead query via SoundVolumeView if you prefer.
  // Here we infer mute by checking a small volume threshold after a forced unmute read attempt (simple kiosk heuristic).
  try {
    await winSetMute(false)
    const v = await winGetVolume()
    return v === 0
  } catch {
    return false
  }
}

// ---------- Public API ----------

export async function setSystemVolume(percent: number): Promise<string | void> {
  if (process.platform === 'linux') return linuxSetVolume(percent)
  if (process.platform === 'win32') return winSetVolume(percent)
  throw new Error('System volume control not implemented on this platform')
}

export async function setSystemMuted(muted: boolean): Promise<string | void> {
  if (process.platform === 'linux') return linuxSetMute(muted)
  if (process.platform === 'win32') return winSetMute(muted)
  throw new Error('System mute control not implemented on this platform')
}

export async function getSystemVolume(): Promise<number> {
  if (process.platform === 'linux') return linuxGetVolume()
  if (process.platform === 'win32') return winGetVolume()
  throw new Error('System volume read not implemented on this platform')
}

export async function getSystemMuted(): Promise<boolean> {
  if (process.platform === 'linux') return linuxGetMute()
  if (process.platform === 'win32') return winGetMute()
  throw new Error('System mute read not implemented on this platform')
}
