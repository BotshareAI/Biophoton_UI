import { create } from 'zustand'
import { Session } from '@shared/types/session'

type SessionsStore = {
  sessions: Session[]
  deleteAll: () => void
  setSessions: (sessions: Session[]) => void
  fetchSessions: (userId: number) => Promise<void>
  addSession: (session: Session) => Promise<void>
  loading: boolean
}

export const useRemediesStore = create<SessionsStore>((set) => {
  return {
    sessions: [],

    loading: false,

    setSessions: (sessions) => set({ sessions }),

    deleteAll: () => set({ sessions: [] }),

    fetchSessions: async (userId) => {
      set({ loading: true })
      try {
        const data = await window.api.getSessionsByClientId(userId)
        set({ sessions: data })
      } finally {
        set({ loading: false })
      }
    },

    addSession: async (session) => {
      const id = await window.api.createSession(session)
      set((state) => ({
        sessions: [...state.sessions, { ...session, id }]
      }))
    }
  }
})
