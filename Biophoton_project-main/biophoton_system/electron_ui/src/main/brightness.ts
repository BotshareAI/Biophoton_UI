import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function execFileAsync(file: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    execFile(file, args, (e) => (e ? reject(e) : resolve()))
  )
}

export async function setBrightness(percent: number): Promise<void> {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))

  if (process.platform === 'linux') {
    // 1) Try sysfs backlight (internal panels)
    try {
      const dir = '/sys/class/backlight'
      const entries = await fs.readdir(dir)

      if (entries.length > 0) {
        const driver = path.join(dir, entries[0])
        const max = Number(await fs.readFile(path.join(driver, 'max_brightness'), 'utf8'))
        const value = Math.round((clamped / 100) * max)
        await fs.writeFile(path.join(driver, 'brightness'), String(value))
        return
      }
      // entries === 0 -> fall through to fallback below
    } catch {
      // fall through to fallback below
    }

    // 2) Fallbacks (no sysfs, no permission, or external monitor)
    // 2a) xrandr (X11)
    try {
      await execFileAsync('bash', [
        '-lc',
        `command -v xrandr >/dev/null 2>&1 && ` +
          `xrandr --current | awk '/ connected/{print $1}' | ` +
          `xargs -I{} xrandr --output {} --brightness ${clamped / 100}`
      ])
      return
    } catch {
      // 2b) wlroots Wayland compositors (sway, river) – optional
      try {
        await execFileAsync('bash', [
          '-lc',
          `command -v wlr-randr >/dev/null 2>&1 && ` +
            `wlr-randr | awk '/^ [^ ]+ /{print $1}' | ` +
            `xargs -I{} wlr-randr --output {} --brightness ${clamped / 100}`
        ])
        return
      } catch {
        // give up on Linux
        throw new Error(
          'Failed to set brightness on Linux: no supported backend or insufficient permissions.'
        )
      }
    }
  }

  if (process.platform === 'win32') {
    const ps = `[void](Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${clamped})`
    await execFileAsync('powershell.exe', ['-NoProfile', '-Command', ps])
    return
  }

  throw new Error(`Unsupported platform: ${os.platform()}`)
}
