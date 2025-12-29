export interface User {
  id: number
  firstName: string
  lastName: string
  photoFile?: string
  dateOfBirth: string
  gender: number
  blood?: number
  saliva?: number
  photo?: number
  symptoms?: string
  daysSinceLastSession?: number
  active: boolean
}

export type NewUser = Omit<User, 'id'>

export interface DatabaseUser {
  id: number
  first_name: string
  last_name: string
  photo_file?: string
  date_of_birth: string
  gender: number
  blood_frequency?: number
  saliva_frequency?: number
  photo_frequency?: number
  symptoms?: string
  last_session: string
  active: boolean
}
