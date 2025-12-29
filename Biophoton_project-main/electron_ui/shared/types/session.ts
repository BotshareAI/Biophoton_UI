import { Points } from './points'
import { Remedy } from './remedy'

export type SessionType = 'session' | 'inversion' | 'lounge'

export interface SessionProgram {
  programId: number
  programVariantId: number
  step: number
  remedies: Remedy[]
}

export interface FullSessionProgram {
  programId: number
  programLabel: string
  time: string
  programOption?: string
  step: number
  remedies: Remedy[]
}

export interface Session {
  id: number
  programs: SessionProgram[]
  meridians?: string[]
  userId?: number
  dateTime?: string
  recommendation?: string
  symptoms?: string
  type: number
  isAdult: boolean
  droppingPoints: Points
  droppingAfterPoints: Points
}

export interface ShortSession {
  id: number
  dateTime: string
}

export interface SessionData {
  programs: FullSessionProgram[]
  user: {
    firstName: string
    lastName: string
  }
  meridians: string[]
  dateTime?: string
  recommendation?: string
  symptoms?: string
  type: number
  isAdult: boolean
  droppingPoints: Points
  droppingAfterPoints: Points
}

export type NewSession = Omit<Session, 'id'>
