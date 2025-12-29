export interface Remedy {
  id: number
  name: string
  category: string
  categoryId: number
  subcategory: string
  subcategoryId: number
  meridians: string[]
  meridianIds: string[]
  frequency: number
  description?: string
  components?: string
}

export type NewRemedy = Omit<Remedy, 'id'>

export interface DatabaseRemedy {
  id: number
  name: string
  category_id: number
  subcategory_id: number
  meridians: number[]
  frequency: number
  description?: string
  components?: string
}

export type NewDatabaseRemedy = Omit<DatabaseRemedy, 'id'>

export interface FilterRemedy {
  category_id?: number
  subcategory_id?: number
  meridian_id?: number
}
