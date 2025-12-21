import { Step } from '@shared/types/step'

export const nextPointer = (current: number, steps: Step[]): number | null => {
  const i = steps.findIndex((p) => p.stepNumber === current)
  return i > -1 && i < steps.length - 1 ? steps[i + 1].stepNumber : null
}

export const prevPointer = (current: number, steps: Step[]): number | null => {
  const i = steps.findIndex((p) => p.stepNumber === current)
  return i > 0 && i < steps.length ? steps[i - 1].stepNumber : null
}
