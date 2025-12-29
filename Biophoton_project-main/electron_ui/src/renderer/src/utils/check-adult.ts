export function calculateAgeFromISO(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number)
  const birthDate = new Date(year, month - 1, day)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export function checkAdult(dateString: string): boolean {
  if (!dateString) return true
  if (calculateAgeFromISO(dateString) > 14) return true
  return false
}
