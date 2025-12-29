import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { NewUser } from '@shared/types/user'
import { FilterRemedy, Remedy } from '@shared/types/remedy'
import { NewSession } from '@shared/types/session'
import { Locale } from '@shared/types/settings'
import { Point } from '@shared/types/point'
import { TreatmentStartPayload } from '@shared/types/treatment'

// Expose Electron API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)

    // Only expose once, with full API
    contextBridge.exposeInMainWorld('api', {
      getStaticData: () => ipcRenderer.invoke('static:get'),
      getClients: (search: string) => ipcRenderer.invoke('clients:get', search),
      createClient: (data: NewUser) => ipcRenderer.invoke('clients:create', data),
      getClientById: (id: number) => ipcRenderer.invoke('clients:getById', id),
      updateClient: (id: number, data: NewUser) => ipcRenderer.invoke('clients:update', id, data),
      deleteClient: (id: number) => ipcRenderer.invoke('clients:delete', id),
      getRemedies: (filters: FilterRemedy) => ipcRenderer.invoke('remedies:get', filters),
      createRemedy: (data: Remedy) => ipcRenderer.invoke('remedies:create', data),
      createSession: (data: NewSession) => ipcRenderer.invoke('sessions:create', data),
      getSessionsById: (id: number) => ipcRenderer.invoke('sessions:getById', id),
      getSessionsByClientId: (id: number) => ipcRenderer.invoke('sessions:getByClientId', id),
      createClientsMany: (rows: NewUser[]) => ipcRenderer.invoke('clients:createMany', rows),
      deleteClientsMany: (ids: number[]) => ipcRenderer.invoke('clients:deleteMany', ids),
      createRemediesMany: (rows: Remedy[]) => ipcRenderer.invoke('remedies:createMany', rows),
      deleteRemediesMany: (ids: number[]) => ipcRenderer.invoke('remedies:deleteMany', ids),
      updateRemedy: (id: number, data: Remedy) => ipcRenderer.invoke('remedies:update', id, data),

      //usb
      listMounts: () => ipcRenderer.invoke('usb:listMounts'),
      listDir: (root: string, rel?: string) => ipcRenderer.invoke('usb:listDir', root, rel),
      getImagePreview: (root: string, relFile: string) =>
        ipcRenderer.invoke('usb:getImagePreview', root, relFile),
      storePhoto: (root: string, relFile: string, oldFilename?: string | null) =>
        ipcRenderer.invoke('usb:storePhoto', root, relFile, oldFilename),

      //avatars
      getDataUrl: (filename: string) => ipcRenderer.invoke('avatars:getDataUrl', filename),
      delete: (filename: string) => ipcRenderer.invoke('avatars:delete', filename),

      //settings
      getAll: () => ipcRenderer.invoke('settings:getAll'),
      get: (key: string) => ipcRenderer.invoke('settings:get', key),
      set: (key: string, value: number | boolean | Locale) =>
        ipcRenderer.invoke('settings:set', key, value),

      //measurement
      measurementStart: () => ipcRenderer.invoke('measurement:start'),
      measurementStop: () => ipcRenderer.invoke('measurement:stop'),
      onValue: (cb: (p: Point) => void) => {
        const handler = (_: unknown, p: Point): void => cb(p)
        ipcRenderer.on('measurement:value', handler)
        // return unsubscribe
        return () => ipcRenderer.removeListener('measurement:value', handler)
      },

      // treatment
      treatmentStart: (payload: TreatmentStartPayload) =>
        ipcRenderer.invoke('treatment:start', payload),
      treatmentStop: () => ipcRenderer.invoke('treatment:stop'),

      //stop worker
      stop: () => ipcRenderer.invoke('worker:stop'),

      //mode 4
      mode4Start: () => ipcRenderer.invoke('mode4:start'),
      onMode4Value: (cb: (p: { freqHz: number }) => void) => {
        const handler = (_e: Electron.IpcRendererEvent, payload: { freqHz: number }): void =>
          cb(payload)
        ipcRenderer.on('mode4:value', handler)
        return () => ipcRenderer.removeListener('mode4:value', handler)
      },
      SAMPLE_INTERVAL_MS: Number(process.env.SAMPLE_INTERVAL_MS || 50),
      cursorHidden: process.argv.includes('--cursorHidden=1')
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = {
    getStaticData: () => ipcRenderer.invoke('static:get'),
    getClients: (search: string) => ipcRenderer.invoke('clients:get', search),
    createClient: (data: NewUser) => ipcRenderer.invoke('clients:create', data),
    getClientById: (id: number) => ipcRenderer.invoke('clients:getById', id),
    updateClient: (id: number, data: NewUser) => ipcRenderer.invoke('clients:update', id, data),
    deleteClient: (id: number) => ipcRenderer.invoke('clients:delete', id),
    getRemedies: (filters: FilterRemedy) => ipcRenderer.invoke('remedies:get', filters),
    createRemedy: (data: Remedy) => ipcRenderer.invoke('remedies:create', data),
    createSession: (data: NewSession) => ipcRenderer.invoke('sessions:create', data),
    getSessionsById: (id: number) => ipcRenderer.invoke('sessions:getById', id),
    getSessionsByClientId: (id: number) => ipcRenderer.invoke('sessions:getByClientId', id),
    createClientsMany: (rows: NewUser[]) => ipcRenderer.invoke('clients:createMany', rows),
    deleteClientsMany: (ids: number[]) => ipcRenderer.invoke('clients:deleteMany', ids),
    createRemediesMany: (rows: Remedy[]) => ipcRenderer.invoke('remedies:createMany', rows),
    deleteRemediesMany: (ids: number[]) => ipcRenderer.invoke('remedies:deleteMany', ids),
    updateRemedy: (id: number, data: Remedy) => ipcRenderer.invoke('remedies:update', id, data),

    //usb
    listMounts: () => ipcRenderer.invoke('usb:listMounts'),
    listDir: (root: string, rel?: string) => ipcRenderer.invoke('usb:listDir', root, rel),
    getImagePreview: (root: string, relFile: string) =>
      ipcRenderer.invoke('usb:getImagePreview', root, relFile),
    storePhoto: (root: string, relFile: string, oldFilename?: string | null) =>
      ipcRenderer.invoke('usb:storePhoto', root, relFile, oldFilename),

    //avatars
    getDataUrl: (filename: string) => ipcRenderer.invoke('avatars:getDataUrl', filename),
    delete: (filename: string) => ipcRenderer.invoke('avatars:delete', filename),

    //settings
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: number | boolean | Locale) =>
      ipcRenderer.invoke('settings:set', key, value),

    //measurement
    measurementStart: () => ipcRenderer.invoke('measurement:start'),
    measurementStop: () => ipcRenderer.invoke('measurement:stop'),
    onValue: (cb: (p: Point) => void) => {
      const handler = (_: unknown, p: Point): void => cb(p)
      ipcRenderer.on('measurement:value', handler)
      // return unsubscribe
      return () => ipcRenderer.removeListener('measurement:value', handler)
    },

    // treatment
    treatmentStart: (payload: TreatmentStartPayload) =>
      ipcRenderer.invoke('treatment:start', payload),
    treatmentStop: () => ipcRenderer.invoke('treatment:stop'),

    //stop worker
    stop: () => ipcRenderer.invoke('worker:stop'),

    //mode 4
    mode4Start: () => ipcRenderer.invoke('mode4:start'),
    onMode4Value: (cb: (p: { freqHz: number }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, payload: { freqHz: number }): void =>
        cb(payload)
      ipcRenderer.on('mode4:value', handler)
      return () => ipcRenderer.removeListener('mode4:value', handler)
    },

    SAMPLE_INTERVAL_MS: Number(process.env.SAMPLE_INTERVAL_MS || 50),
    cursorHidden: process.argv.includes('--cursorHidden=1')
  }
}
