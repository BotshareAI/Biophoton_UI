import { ipcMain } from 'electron'
import { settingsStore } from '../settings'
import { Locale, Settings } from '@shared/types/settings'
import { setBrightness } from '../brightness'
import { setSystemMuted, setSystemVolume } from '../sound'

ipcMain.handle('settings:getAll', () => settingsStore.store)

ipcMain.handle('settings:get', (_e, key: string, fallback) => {
  return settingsStore.get(key as keyof Settings, fallback)
})

ipcMain.handle('settings:set', async (_e, key: string, value: number | boolean | Locale) => {
  settingsStore.set(key, value)
  if (key == 'brightness') {
    try {
      await setBrightness(Number(value))
    } catch (e) {
      console.warn('Brightness set failed:', e)
    }
  } else if (key === 'volume') {
    try {
      await setSystemVolume(Number(value))
    } catch (e) {
      console.warn('setSystemVolume failed', e)
    }
  } else if (key === 'soundEnabled') {
    try {
      await setSystemMuted(!value)
    } catch (e) {
      console.warn('setSystemMuted failed', e)
    }
  }
  return true
})
