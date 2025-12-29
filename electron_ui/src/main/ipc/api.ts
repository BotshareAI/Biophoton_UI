import { ipcMain } from 'electron'
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  createRemedy,
  getRemedies,
  deleteClient,
  createSession,
  getSessionById,
  getSessionsByClientId,
  createClientsMany,
  deleteClientsMany,
  createRemediesMany,
  deleteRemediesMany,
  updateRemedy,
  getStaticData
} from '../db/queries'
import { NewUser } from '@shared/types/user'
import { Remedy } from '@shared/types/remedy'

// Static data: categories, subcategories...
ipcMain.handle('static:get', () => {
  return getStaticData()
})
// Clients
ipcMain.handle('clients:get', (_, search: string) => {
  return getClients(search)
})
ipcMain.handle('clients:create', (_, client) => {
  return createClient(client)
})
ipcMain.handle('clients:getById', (_, id: number) => getClientById(id))
ipcMain.handle('clients:update', (_, id, user) => updateClient(id, user))
ipcMain.handle('clients:delete', (_, id: number) => deleteClient(id))
ipcMain.handle('clients:createMany', (_e, rows: NewUser[]) => createClientsMany(rows))
ipcMain.handle('clients:deleteMany', (_e, ids: number[]) => {
  deleteClientsMany(ids)
  return { ok: true }
})

// Remedies
ipcMain.handle('remedies:get', (_, filters) => getRemedies(filters))
ipcMain.handle('remedies:update', (_e, id: number, remedy) => {
  updateRemedy(id, remedy)
  return { ok: true as const }
})
ipcMain.handle('remedies:create', (_, remedy) => createRemedy(remedy))
ipcMain.handle('remedies:createMany', (_e, rows: Remedy[]) => createRemediesMany(rows))
ipcMain.handle('remedies:deleteMany', (_e, ids: number[]) => {
  deleteRemediesMany(ids)
  return { ok: true }
})

// Sessions
ipcMain.handle('sessions:create', (_, session) => createSession(session))
ipcMain.handle('sessions:getById', (_, id: number) => getSessionById(id))
ipcMain.handle('sessions:getByClientId', (_, id: number) => getSessionsByClientId(id))
