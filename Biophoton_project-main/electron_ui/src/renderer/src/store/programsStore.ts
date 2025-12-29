import { create } from 'zustand'
import { Program } from '@shared/types/program'
import { Step } from '@shared/types/step'

type ProgramsStore = {
  programs: Program[]
  steps: Step[]
  loading: boolean
  setData: (programs: Program[], steps: Step[]) => void
  getProgramsByStep: (stepNum: number, isAdult: boolean) => Program[]
  getSteps: (isAdult: boolean) => Step[]
  getLounge: () => Program
  getInversion: () => Program
}

export const useProgramsStore = create<ProgramsStore>((set, get) => ({
  programs: [],
  steps: [],
  loading: true,
  setData: (programs, steps) => {
    set({ loading: false, programs, steps })
  },
  getProgramsByStep: (stepNum, isAdult = true) => {
    const step = get().steps.filter((s) => s.stepNumber == stepNum && s.isAdult == isAdult)[0]
    const programs = get().programs
    return step.programs.map((pId) => programs.filter((p) => pId == p.id)[0])
  },
  getSteps: (isAdult) => {
    return get().steps.filter((s) => s.isAdult == isAdult)
  },
  getLounge: () => get().programs.filter((p) => 'Light Lounge' == p.label)[0],
  getInversion: () => get().programs.filter((p) => 'Inversion' == p.label)[0]
}))
