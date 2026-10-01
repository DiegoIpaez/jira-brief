export const NO_TIME = '—'

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return NO_TIME

  const minutes = Math.round(seconds / 60)
  if (minutes === 0) return NO_TIME
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes === 0
    ? `${hours} h`
    : `${hours} h ${remainingMinutes} min`
}

export function hasNoTime(seconds: number): boolean {
  return !Number.isFinite(seconds) || seconds <= 0 || Math.round(seconds / 60) === 0
}
