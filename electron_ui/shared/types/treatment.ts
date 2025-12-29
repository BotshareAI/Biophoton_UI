export interface TreatmentStartPayload {
  blood?: number
  saliva?: number
  photo?: number
  remedies?: number[] // up to 10, rest auto-filled with 0
  durationMs: number
}
