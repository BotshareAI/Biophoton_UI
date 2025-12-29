import { create } from 'zustand'
import { Remedy } from '@shared/types/remedy'

type Remediestore = {
  remedies: Remedy[]
  selectedRemedies: (Remedy | null)[]
  footplateRemedies: (Remedy | null)[]
  setRemedyAtSlot: (index: number, remedy: Remedy | null, footplate?: boolean) => void
  getRemediesByCategory: (category: string, subcategory: string) => Remedy[]
  deleteAll: (footplate?: boolean) => void
  resetAll: (remedies?: Remedy[]) => void
  activeSlotIndex: number
  footPlateActiveSlotIndex: number
  setActiveSlotIndex: (index: number, footplate?: boolean) => void
  setRemedies: (remedies: Remedy[], footplate?: boolean) => void
  getRemediesByMeridian: (meridian: string) => Remedy[]
  fetchRemedies: () => Promise<void>
  addRemedy: (newUser: Remedy) => Promise<void>
  loading: boolean
  deleteRemedies: (ids: number[]) => Promise<void>
  updateRemedy: (data: Remedy) => Promise<void>
  isFootplate: boolean
  setIsFootplate: (footplate: boolean) => void
  resetAndSelectSlot: (index: number, footplate: boolean) => void
}

const totalSlots = 10

export const useRemediesStore = create<Remediestore>((set, get) => {
  const categoryCache = new Map<string, Remedy[]>()
  const meridianCache = new Map<string, Remedy[]>()
  return {
    remedies: [],

    loading: false,

    selectedRemedies: Array(totalSlots).fill(null),

    footplateRemedies: Array(totalSlots).fill(null),

    activeSlotIndex: 0,

    footPlateActiveSlotIndex: 0,

    isFootplate: false,

    setActiveSlotIndex: (index, footplate = false) => {
      if (footplate) {
        set({ footPlateActiveSlotIndex: index })
      } else {
        set({ activeSlotIndex: index })
      }
    },

    getRemediesByCategory: (category, subcategory) => {
      const key = `${category}-${subcategory}`
      if (categoryCache.has(key)) {
        return categoryCache.get(key)!
      }

      const filtered = get().remedies.filter(
        (r) => r.category === category && r.subcategory === subcategory
      )
      categoryCache.set(key, filtered)
      return filtered
    },

    getRemediesByMeridian: (meridian) => {
      if (meridianCache.has(meridian)) {
        return meridianCache.get(meridian)!
      }

      const filtered = get().remedies.filter((r) => r.meridianIds?.includes(meridian))
      meridianCache.set(meridian, filtered)
      return filtered
    },

    setRemedyAtSlot: (index, remedyOrNull, footplate = false) => {
      set((state) => {
        if (index < 0 || index >= totalSlots) return state
        if (footplate) {
          const newSelected = [...state.footplateRemedies]
          newSelected[index] = remedyOrNull
          return { footplateRemedies: newSelected }
        } else {
          const newSelected = [...state.selectedRemedies]
          newSelected[index] = remedyOrNull
          return { selectedRemedies: newSelected }
        }
      })
    },

    setRemedies: (remedies, footplate = false) => {
      set((state) => {
        const remediesLen = remedies.length
        if (footplate) {
          return {
            footplateRemedies: state.footplateRemedies.map((_, index) =>
              index < remediesLen ? remedies[index] : null
            ),
            footPlateActiveSlotIndex: remediesLen
          }
        } else {
          return {
            selectedRemedies: state.selectedRemedies.map((_, index) =>
              index < remediesLen ? remedies[index] : null
            ),
            activeSlotIndex: remediesLen
          }
        }
      })
    },

    deleteAll: (footplate = false) => {
      if (footplate) {
        set({ footplateRemedies: Array(totalSlots).fill(null), footPlateActiveSlotIndex: 0 })
      } else {
        set({ selectedRemedies: Array(totalSlots).fill(null), activeSlotIndex: 0 })
      }
    },

    resetAll: (remedies) => {
      const selectedRemedies = Array(totalSlots).fill(null)
      let activeSlotIndex = 0
      if (remedies) {
        activeSlotIndex = remedies.length
        activeSlotIndex &&
          remedies.forEach((r, index) => {
            selectedRemedies[index] = r
          })
      }
      set({
        selectedRemedies,
        activeSlotIndex,
        footplateRemedies: Array(totalSlots).fill(null),
        footPlateActiveSlotIndex: 0,
        isFootplate: false
      })
    },

    fetchRemedies: async () => {
      set({ loading: true })
      try {
        const data = await window.api.getRemedies({})
        set({ remedies: data })
      } finally {
        set({ loading: false })
      }
    },

    addRemedy: async (newRemedy) => {
      const id = await window.api.createRemedy(newRemedy)
      set((state) => ({
        remedies: [...state.remedies, { ...newRemedy, id }]
      }))
    },

    deleteRemedies: async (ids: number[]) => {
      try {
        await window.api.deleteRemediesMany(ids)
        set((state) => ({ remedies: state.remedies.filter((r) => !ids.includes(r.id)) }))
      } catch {
        //error
      }
    },

    updateRemedy: async (updatedRemedy) => {
      await window.api.updateRemedy(updatedRemedy.id, updatedRemedy)
      set((state) => ({
        remedies: state.remedies.map((remedy) =>
          remedy.id === updatedRemedy.id ? updatedRemedy : remedy
        )
      }))
    },

    resetAndSelectSlot: (index, footplate) => {
      set((state) => {
        if (footplate) {
          const newSelected = [...state.footplateRemedies]
          newSelected[index] = null
          return {
            footplateRemedies: newSelected,
            footPlateActiveSlotIndex: index,
            isFootplate: footplate
          }
        } else {
          const newSelected = [...state.selectedRemedies]
          newSelected[index] = null
          return { selectedRemedies: newSelected, activeSlotIndex: index, isFootplate: footplate }
        }
      })
    },

    setIsFootplate: (isFootplate) => set({ isFootplate })
  }
})
