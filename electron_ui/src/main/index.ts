import { app, shell, BrowserWindow, ipcMain, protocol, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import icon from '../../resources/icon.png?asset'
import './ipc/api'
import './ipc/usb'
import './ipc/settings'
import { attachWindow } from './measurement'

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    useContentSize: true,
    width: 1280,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    fullscreen: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [
        `--cursorHidden=${(process.env.CURSOR_HIDDEN || 'false') === 'true' ? '1' : '0'}`
      ]
    }
  })

  mainWindow.webContents.openDevTools({ mode: 'detach' })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'avatar',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: false,
      corsEnabled: false
    }
  }
])

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const AVATAR_ROOT = path.join(app.getPath('userData'), 'avatars')

  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit()
  })

  protocol.handle('avatar', async (request) => {
    try {
      const u = new URL(request.url) // e.g. avatar:///abc.webp
      // sanitize: strip leading slashes and decode
      const name =
        decodeURIComponent(u.pathname.replace(/^\/+/, '')) || decodeURIComponent(u.hostname)

      // enforce: no subfolders, no traversal, must be .webp
      if (!name || path.basename(name) !== name || !name.toLowerCase().endsWith('.webp')) {
        return new Response('Invalid avatar path', { status: 400 })
      }

      const full = path.join(AVATAR_ROOT, name)
      await fsp.access(full, fs.constants.R_OK)

      const domStream = Readable.toWeb(
        fs.createReadStream(full)
      ) as unknown as ReadableStream<Uint8Array>
      return new Response(domStream, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  const win = createWindow()

  attachWindow(win)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
