import { create } from 'zustand'
import { User, NewUser } from '@shared/types/user'

type UserStore = {
  users: User[]
  loading: boolean
  fetchUsers: (search: string) => Promise<void>
  addUser: (newUser: NewUser) => Promise<void>
  updateUser: (id: number, updated: NewUser) => Promise<void>
  deleteUser: (id: number) => Promise<void>
  deleteUsers: (ids: number[]) => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,

  fetchUsers: async (search: string) => {
    set({ loading: true })
    try {
      const data = await window.api.getClients(search)
      set({ users: data })
    } finally {
      set({ loading: false })
    }
  },

  addUser: async (newUser) => {
    const id = await window.api.createClient(newUser)
    set((state) => ({
      users: [...state.users, { ...newUser, id }]
    }))
  },

  updateUser: async (id, updatedUser) => {
    await window.api.updateClient(id, updatedUser)
    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { id, ...updatedUser } : user))
    }))
  },

  deleteUser: async (id) => {
    await window.api.deleteClient(id)
    set((state) => ({
      users: state.users.filter((u) => u.id !== id)
    }))
  },

  deleteUsers: async (ids: number[]) => {
    try {
      await window.api.deleteClientsMany(ids)
      set((state) => ({ users: state.users.filter((u) => !ids.includes(u.id)) }))
    } catch {
      //error
    }
  }
}))
