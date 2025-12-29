export type Program = {
  id: number
  programVariantIds: number[]
  name: string
  icon?: string
  optionTitle?: string
  options?: string[]
  totalTime: string | string[]
  label?: string
}
