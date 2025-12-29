import { create } from 'zustand'
import { Category } from '@shared/types/category'
import { Subcategory } from '@shared/types/subcategory'
import { Meridian, MeridianSelect } from '@shared/types/meridian'

type CategoriesStore = {
  categories: Category[]
  subcategories: Subcategory[]
  meridians: MeridianSelect[]
  loading: boolean
  setData: (categories: Category[], subcategories: Subcategory[], meridians: Meridian[]) => void
  getSubcategories: (category: string) => Subcategory[]
}

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  subcategories: [],
  meridians: [],
  loading: true,
  setData: (categories, subcategories, meridians) => {
    set({
      loading: false,
      categories,
      subcategories,
      meridians: meridians.map((m) => ({ value: m.id.toString(), label: m.name }))
    })
  },
  getSubcategories: (category: string) => {
    const categoryId = get().categories.filter((c) => c.name == category)[0].id
    return get().subcategories.filter((s) => s.category_id == categoryId)
  }
}))
