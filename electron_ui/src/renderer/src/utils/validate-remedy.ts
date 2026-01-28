import { Remedy } from '@shared/types/remedy'

export function validateRemedy(
  remedy: Remedy,
  callback: (key: keyof Remedy, label: string) => void
): boolean {
  let result = true
  if (!remedy.name) {
    callback('name', 'Name')
    result = false
  }
  if (!remedy.categoryId) {
    callback('categoryId', 'Category')
    result = false
  }
  if (!remedy.subcategoryId) {
    callback('subcategoryId', 'Subcategory')
    result = false
  }
  // Meridian selection is now optional - no validation needed
  return result
}
