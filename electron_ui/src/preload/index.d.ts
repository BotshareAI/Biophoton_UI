import { ElectronAPI } from '@electron-toolkit/preload'
import { Remedy, FilterRemedy } from '@shared/types/remedy'
import { TreatmentStartPayload } from '@shared/types/treatment'
import type { User, NewUser } from '@shared/types/user'
import { NewSession, Session } from '@shared/types/session'
import { Point } from '@shared/types/point'
import { Static } from '@shared/types/static'

interface Api {
  getStaticData: () => Promise<Static>
  getClients: (search: string) => Promise<User[]>
  getClientById: (id: number) => Promise<User | null>
  createClient: (data: NewUser) => Promise<number>
  updateClient: (id: number, data: NewUser) => Promise<void>
  deleteClient: (id: number) => Promise<void>
  getRemedies: (filters: FilterRemedy) => Promise<Remedy[]>
  createRemedy: (data: Remedy) => Promise<number>
  updateRemedy: (id: number, data: Remedy) => Promise<{ ok: true }>
  createSession: (data: NewSession) => Promise<number>
  getSessionsById: (id: number) => Promise<Session>
  getSessionsByClientId: (id: number) => Promise<Session[]>
  createClientsMany: (rows: NewUser[]) => Promise<number[]>
  deleteClientsMany: (ids: number[]) => Promise<void>
  createRemediesMany: (rows: Remedy[]) => Promise<number[]>
  deleteRemediesMany: (ids: number[]) => Promise<void>
  //usb
  listMounts: () => Promise<Array<{ id: string; label: string; path: string }>>
  listDir: (
    root: string,
    rel?: string
  ) => Promise<{
    items: Array<{
      name: string
      isDir: boolean
      ext: string
      relPath: string
      size: number
      mtime: number
    }>
    canUp: boolean
  }>
  getImagePreview: (root: string, relFile: string) => Promise<string>
  storePhoto: (
    root: string,
    relFile: string,
    oldFilename?: string | null
  ) => Promise<{ ok: true; file: string; dataUrl: string }>
  //avatars
  getDataUrl: (filename: string) => Promise<string>
  delete: (filename: string) => Promise<{ ok: true }>
  //settings
  getAll(): Promise<Settings>
  get<T>(key: string, fallback: T): Promise<T>
  set(key: string, value: Locale | number | boolean): Promise<true>
  //measurement (Mode 1)
  measurementStart(): Promise<{ ok: true; note?: string }>
  measurementStop(): Promise<{ ok: true; note?: string }>
  onValue(cb: (p: Point) => void): () => void
  //treatment (Mode 2)
  treatmentStart(
    payload: TreatmentStartPayload
  ): Promise<{ ok: boolean; sent?: string; note?: string }>
  treatmentStop(): Promise<{ ok: boolean }>
  //stop worker
  stop(): Promise<{ ok: true; note?: string }>
  mode4Start(): Promise<{ ok: boolean }>
  onMode4Value(cb: (p: { freqHz: number }) => void): () => void
  SAMPLE_INTERVAL_MS: number
  cursorHidden: boolean
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
