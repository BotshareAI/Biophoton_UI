export function daysSince(dateStr: string): number {
  const inputDate = new Date(dateStr).getTime()
  const today = Date.now()
  const diffMs = today - inputDate
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
