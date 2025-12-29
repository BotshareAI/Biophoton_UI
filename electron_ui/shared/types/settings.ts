export type Locale = 'en' | 'es'

export interface Settings {
  locale: Locale
  soundEnabled: boolean
  volume: number
  brightness: number
}
