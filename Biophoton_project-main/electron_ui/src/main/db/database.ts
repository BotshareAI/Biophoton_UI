import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

const dbPath = path.join(app.getPath('userData'), 'app.db')
export const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')
