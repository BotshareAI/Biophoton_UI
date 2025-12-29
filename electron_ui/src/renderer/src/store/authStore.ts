import { create } from 'zustand'

type AuthState = {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  login: (username, password) => {
    // Replace with real logic or API later
    const isValid = username === 'admin' && password === 'admin'
    if (isValid) set({ isAuthenticated: true })
    return isValid
  },
  logout: () => set({ isAuthenticated: false })
}))
