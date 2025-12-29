import { NewUser } from '@shared/types/user'

export const users: NewUser[] = [
  {
    firstName: 'Alice',
    lastName: 'Smith',
    gender: 2,
    dateOfBirth: '1985-04-12',
    blood: 505,
    symptoms: '',
    active: false
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    gender: 1,
    dateOfBirth: '1990-07-21',
    saliva: 202,
    symptoms: '',
    active: true
  }
]
