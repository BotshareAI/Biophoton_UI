import { Category } from './category'
import { Meridian } from './meridian'
import { Program } from './program'
import { Step } from './step'
import { Subcategory } from './subcategory'

export type Static = {
  categories: Category[]
  subcategories: Subcategory[]
  meridians: Meridian[]
  programs: Program[]
  steps: Step[]
}
