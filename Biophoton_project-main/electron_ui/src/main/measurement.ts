import { app, BrowserWindow, ipcMain } from 'electron'
import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type { Readable, Writable } from 'node:stream'
import path from 'node:path'
import fs from 'node:fs'
import { TreatmentStartPayload } from '@shared/types/treatment'

let proc: ChildProcessByStdio<Writable, Readable, null> | null = null
let seq = 0
let win: BrowserWindow | null = null
let quitting = false

export function attachWindow(w: BrowserWindow): void {
  win = w
}

function resolveJs(resName: string): string {
  // prod: extraResources
  const prod = path.join(process.resourcesPath, 'js', resName)
  if (app.isPackaged && fs.existsSync(prod)) return prod
  // dev: repo
  const dev = path.join(process.cwd(), 'resources', 'js', resName)
  if (fs.existsSync(dev)) return dev
  // fallback (relative to compiled main)
  return path.join(__dirname, '../../resources/js', resName)
}

function spawnReader(): ChildProcessByStdio<Writable, Readable, null> {
  const script = resolveJs('serial_reader.cjs')

  seq = 0
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    REQUIRE_BASE: app.getAppPath(), // so serial_reader can require('serialport')
    SERIAL_PATH: process.env.SERIAL_PATH || '/dev/ttyACM0',
    SERIAL_BAUD: process.env.SERIAL_BAUD || '115200'
  }

  const child = spawn(process.execPath, [script], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env
  })
  child.stdout.setEncoding('utf8')

  let buf = ''
  const onData = (chunk: string): void => {
    buf += chunk
    let i: number
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      // Mode 1
      const n = Number(line)
      if (!Number.isNaN(n)) {
        win?.webContents.send('measurement:value', { x: ++seq, y: n })
        continue
      }
      // Mode 2
      if (line.startsWith('EMIT\t')) {
        // EMIT\t<uptime>\t<blood>\t<saliva>\t<photo>\t<r1>...\t<r10>\t<duration>
        const parts = line.split('\t')
        const [, uptimeStr, ...rest] = parts
        const nums = rest.map((x) => Number(x) || 0)
        const payload = {
          uptimeMs: Number(uptimeStr) || 0,
          blood: nums[0] ?? 0,
          saliva: nums[1] ?? 0,
          photo: nums[2] ?? 0,
          remedies: nums.slice(3, 13),
          durationMs: nums.at(-1) ?? 0
        }
        win?.webContents.send('treatment:emit', payload)
        continue
      }

      if (line === 'EMIT_DONE') {
        win?.webContents.send('treatment:done', {})
        continue
      }
      if (line.startsWith('RNG\t')) {
        const parts = line.split('\t')
        const freqHz = Number(parts[1]) || 0
        win?.webContents.send('mode4:value', { freqHz })
        continue
      }
    }
  }

  child.stdout.on('data', onData)
  child.stdout.on('error', (err) => {
    // parent read side errors are rare, but log them
    console.warn('[serial stdout error]', err?.message || err)
  })

  child.on('exit', (code, signal) => {
    console.log('[serial proc exit]', code, signal)
    if (proc === child) proc = null
    win?.webContents.send('measurement:status', { type: 'closed', code, signal })
  })

  return child
}

function sendToChild(cmd: string): boolean {
  if (!proc || !proc.stdin || proc.stdin.writableEnded || proc.stdin.destroyed) return false
  try {
    proc.stdin.write(cmd.endsWith('\n') ? cmd : cmd + '\n')
    return true
  } catch (e) {
    console.warn('[sendToChild failed]', (e as Error)?.message || e)
    return false
  }
}

// Graceful stop we can await (used for stop + app quit)
function stopChild(_, timeoutMs = 800): Promise<void> {
  return new Promise((resolve) => {
    if (!proc) return resolve()

    const child = proc
    proc = null // prevent double-kill races
    const done = (): void => resolve()

    const onExit = (): void => {
      child.removeAllListeners('exit')
      child.stdout?.removeAllListeners?.('data')
      child.stdout?.removeAllListeners?.('error')
      done()
    }

    child.once('exit', onExit)

    try {
      // Ask it to stop writing/exit
      child.kill('SIGTERM')
    } catch {
      // ignore
    }

    // Hard fallback if it hangs
    setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        /* empty */
      }
      onExit()
    }, timeoutMs).unref()
  })
}

ipcMain.handle('measurement:start', async () => {
  if (!proc) proc = spawnReader()
  const ok = sendToChild('MEASURE')
  return { ok }
})

ipcMain.handle('measurement:stop', async () => {
  if (!proc) return { ok: true, note: 'not running' }
  const ok = sendToChild('STOP')
  return { ok }
})

ipcMain.handle('treatment:start', async (_e, payload: TreatmentStartPayload) => {
  const blood = Number(payload?.blood ?? 0)
  const saliva = Number(payload?.saliva ?? 0)
  const photo = Number(payload?.photo ?? 0)
  const durationMs = Number(payload?.durationMs ?? 0)

  const remedies = Array.isArray(payload?.remedies) ? payload.remedies.slice(0, 10) : []
  while (remedies.length < 10) remedies.push(0)

  // Build: TREAT <blood> <saliva> <photo> <r1>...<r10> <duration_ms>
  const line = ['TREAT', blood, saliva, photo, ...remedies, durationMs].join(' ')
  const ok = sendToChild(line)
  return { ok, sent: ok ? line : undefined }
})

ipcMain.handle('treatment:stop', async () => {
  if (!proc) return { ok: true, note: 'not running' }
  const ok = sendToChild('STOP')
  return { ok }
})

ipcMain.handle('worker:stop', async () => {
  if (!proc) return { ok: true, note: 'not running' }
  await stopChild('manual-stop')
  return { ok: true }
})

ipcMain.handle('mode4:start', async () => {
  if (!proc) proc = spawnReader()
  const ok = sendToChild('RNG')
  return { ok }
})

// Wait for child to exit before quitting, to avoid EPIPE
app.on('will-quit', (e) => {
  if (proc && !quitting) {
    quitting = true
    e.preventDefault()
    stopChild('app-will-quit').finally(() => {
      // exit after child is down
      app.exit(0)
    })
  }
})
