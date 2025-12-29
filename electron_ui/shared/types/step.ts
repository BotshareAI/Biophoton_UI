export type Step = {
  id: number
  type: number // 1 - adult, 2 - kid
  label: string
  stepNumber: number
  showRemedies: boolean
  programs: number[]
  isAdult?: boolean
}

export type StepId = 1 | 2
