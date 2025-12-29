export function timeToSeconds(time: string): number {
  if (!time) return 0
  const [minutes, seconds] = time.split(':').map(Number)
  if (isNaN(minutes) || isNaN(seconds)) {
    throw new Error(`Invalid time format: ${time}`)
  }
  return minutes * 60 + seconds
}
