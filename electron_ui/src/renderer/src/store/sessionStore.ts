import { create } from 'zustand'
import { User } from '@shared/types/user'
import { SessionProgram } from '@shared/types/session'
import { Points } from '@shared/types/points'

type SessionStore = {
  user?: User
  currentStep: number
  setCurrentStep: (step: number) => void
  setUser: (user?: User) => void
  showRecordPoints: boolean
  toggleRecordPoints: (toggle: boolean) => void
  type: number
  startSession: (type: number, isAdultSession: boolean, user?: User) => void
  isAdultSession: boolean
  toggleIsAdultSession: (isAdultSession: boolean) => void
  savedPrograms: SessionProgram[]
  addSavedProgram: (program: SessionProgram) => void
  reset: () => void
  focusedMeridians: string[]
  meridianNames: string[]
  setFocusedMeridians: (meridians: string[], meridianNames: string[]) => void
  symptoms: string
  setSymptoms: (symptoms: string) => void
  droppingPoints: Points
  setDroppingPoints: (points: Points) => void
  isAfter: boolean
  droppingAfterPoints: Points
}

const defaultPoints = {
  lh: [],
  rh: [],
  lf: [],
  rf: []
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: undefined,

  currentStep: 1,

  focusedMeridians: [],

  meridianNames: [],

  symptoms: '',

  droppingPoints: defaultPoints,

  droppingAfterPoints: defaultPoints,

  isAfter: false,

  setCurrentStep: (currentStep) => set(() => ({ currentStep })),

  setUser: (user) => set(() => ({ user })),

  showRecordPoints: false,

  toggleRecordPoints: (toggle) => set(() => ({ showRecordPoints: toggle })),

  type: 1, // 1 - Session, 2 - Inversion, 3 - Medbed

  startSession: (type, isAdultSession, user) =>
    set(() => ({
      type,
      user,
      isAdultSession,
      currentStep: 1,
      savedPrograms: [],
      showRecordPoints: false,
      droppingPoints: defaultPoints
    })),

  isAdultSession: true,

  toggleIsAdultSession: (isAdultSession) => set(() => ({ isAdultSession, currentStep: 1 })),

  savedPrograms: [],

  addSavedProgram: (program) => {
    set((state) => {
      const savedPrograms = state.savedPrograms.filter(
        (p) => !(p.programId == program.programId && p.step == program.step)
      )
      const isAfter = state.isAfter || program.step == 2
      return { savedPrograms: [...savedPrograms, program], isAfter }
    })
  },

  reset: () =>
    set(() => ({
      user: undefined,
      currentStep: 1,
      savedPrograms: [],
      focusedMeridians: [],
      symptoms: ''
    })),

  setFocusedMeridians: (focusedMeridians, meridianNames) =>
    set(() => ({ focusedMeridians, meridianNames })),

  setSymptoms: (symptoms) => set(() => ({ symptoms })),

  setDroppingPoints: (droppingPoints) =>
    set((state) => {
      if (state.isAfter) {
        return { droppingAfterPoints: droppingPoints }
      }
      return { droppingPoints }
    })
}))
