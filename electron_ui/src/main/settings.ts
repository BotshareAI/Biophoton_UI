import { Settings } from '@shared/types/settings'
import Store from 'electron-store'

export const settingsStore = new Store<Settings>({
  name: 'settings',
  defaults: {
    locale: 'en',
    soundEnabled: true,
    volume: 50,
    brightness: 50
  }
})
