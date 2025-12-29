import { app, ipcMain, nativeImage } from 'electron'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import drivelist from 'drivelist'
import sharp from 'sharp'

type Mount = { id: string; label: string; path: string }
type UsbItem = {
  name: string
  isDir: boolean
  ext: string
  relPath: string
  size: number
  mtime: number
}

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const AVATARS_DIR = path.join(app.getPath('userData'), 'avatars')
const THUMB_SIZE = 256
const THUMB_EXT = '.webp'
const THUMB_MIME = 'image/webp'

// ---------- helpers
function ensureWinRoot(p: string): string {
  if (process.platform === 'win32' && /^[A-Za-z]:$/.test(p)) return p + path.win32.sep // "E:" -> "E:\"
  return p
}

function norm(p: string): string {
  // Normalize consistently per-OS
  return process.platform === 'win32'
    ? path.win32.normalize(path.resolve(p))
    : path.posix.normalize(path.resolve(p))
}

// Use path.relative for containment (works for both "E:\" and subdirs)
function inside(child: string, root: string): boolean {
  const rel = path.relative(root, child)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

function isImg(p: string): boolean {
  return IMG_EXT.has(path.extname(p).toLowerCase())
}

async function getUsbMounts(): Promise<Mount[]> {
  const drives = await drivelist.list()
  const mounts: Mount[] = []
  for (const d of drives) {
    if (d.isRemovable || d.isUSB || d.isCard || d.busType === 'USB') {
      for (const m of d.mountpoints) {
        if (m.path && fs.existsSync(m.path)) {
          const fixed = ensureWinRoot(m.path)
          mounts.push({
            id: `${d.device}:${fixed}`,
            label: d.description || 'Removable',
            path: norm(fixed)
          })
        }
      }
    }
  }
  return mounts
}

async function ensureAvatarsDir(): Promise<void> {
  await fsp.mkdir(AVATARS_DIR, { recursive: true })
}

// ---------- IPC: list mounts / dir / tiny previews (for the picker)
ipcMain.handle('usb:listMounts', async () => {
  return await getUsbMounts()
})

ipcMain.handle('usb:listDir', async (_e, root: string, rel = '') => {
  const rootAbs = norm(ensureWinRoot(root))

  // Convert the renderer's forward slashes to the OS separator
  const relOs = rel ? rel.split('/').join(path.sep) : ''
  const full = norm(path.join(rootAbs, relOs))

  if (!inside(full, rootAbs)) throw new Error('Out of bounds')

  const entries = await fsp.readdir(full, { withFileTypes: true })
  const items: UsbItem[] = []

  for (const d of entries) {
    const p = path.join(full, d.name)
    const stat = await fsp.stat(p).catch(() => null)
    items.push({
      name: d.name,
      isDir: d.isDirectory(),
      ext: d.isDirectory() ? '' : path.extname(d.name).toLowerCase(),
      // Always send forward slashes to the renderer for consistency
      relPath: path.relative(rootAbs, p).split(path.sep).join('/'),
      size: stat?.size ?? 0,
      mtime: stat?.mtimeMs ?? 0
    })
  }

  const filtered = items.filter((i) => i.isDir || IMG_EXT.has(i.ext))
  filtered.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name))

  const canUp = path.relative(rootAbs, full) !== ''
  return { items: filtered, canUp }
})

// Lightweight preview for the picker (uses nativeImage)
ipcMain.handle('usb:getImagePreview', async (_e, root: string, relFile: string) => {
  const rootAbs = norm(ensureWinRoot(root))
  const full = norm(path.join(rootAbs, relFile.split('/').join(path.sep)))
  if (!inside(full, rootAbs)) throw new Error('Out of bounds')
  if (!isImg(full)) throw new Error('Not an image')

  const img = nativeImage.createFromPath(full)
  if (!img.isEmpty()) {
    const thumb = img.resize({ width: 256, height: 256, quality: 'good' })
    return thumb.toDataURL()
  }

  // Fallback: raw file -> Data URL (works from any origin)
  const ext = path.extname(full).toLowerCase()
  const mime =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg'
  const buf = await fsp.readFile(full)
  return `data:${mime};base64,${buf.toString('base64')}`
})

// ---------- IPC: storePhoto — generate & keep only 256×256 thumbnail with sharp
// Accepts optional oldFilename to clean up previous avatar file.
ipcMain.handle(
  'usb:storePhoto',
  async (_e, root: string, relFile: string, oldFilename?: string | null) => {
    const rootAbs = norm(root)
    const src = norm(path.join(rootAbs, relFile))
    if (!inside(src, rootAbs)) throw new Error('Out of bounds')
    if (!isImg(src)) throw new Error('Not an image')

    await ensureAvatarsDir()

    // Remove old avatar if provided
    if (oldFilename) {
      const oldFull = path.join(AVATARS_DIR, oldFilename)
      try {
        await fsp.unlink(oldFull)
        // eslint-disable-next-line no-empty
      } catch {}
    }

    const id = crypto.randomUUID()
    const filename = `${id}${THUMB_EXT}`
    const dest = path.join(AVATARS_DIR, filename)

    // Generate a square 256×256 thumbnail: auto-rotate (EXIF), center/attention crop, and encode to WebP/JPEG
    const pipeline = sharp(src).rotate().resize(THUMB_SIZE, THUMB_SIZE, {
      fit: 'cover',
      position: 'attention' // or 'entropy'
    })

    if (THUMB_EXT === '.webp') {
      await pipeline.webp({ quality: 80, effort: 4 }).toFile(dest)
    } else {
      await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(dest)
    }

    // Build a data URL for immediate preview
    const buf = await fsp.readFile(dest)
    const dataUrl = `data:${THUMB_MIME};base64,${buf.toString('base64')}`

    // Return only the filename (store this in DB), plus dataUrl for instant UI
    return { ok: true as const, file: filename, dataUrl }
  }
)

// ---------- IPC: avatars:getDataUrl — load by filename later (DB -> UI)
ipcMain.handle('avatars:getDataUrl', async (_e, filename: string) => {
  const base = norm(AVATARS_DIR)
  const full = norm(path.join(base, filename))
  if (!inside(full, base)) throw new Error('Out of bounds')
  const buf = await fsp.readFile(full)
  return `data:${THUMB_MIME};base64,${buf.toString('base64')}`
})

// Optional: delete avatar by filename (e.g., on user delete)
ipcMain.handle('avatars:delete', async (_e, filename: string) => {
  const full = path.join(AVATARS_DIR, filename)
  try {
    await fsp.unlink(full)
    // eslint-disable-next-line no-empty
  } catch {}
  return { ok: true }
})
