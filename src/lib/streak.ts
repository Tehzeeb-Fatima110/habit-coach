import type { Log } from '../types.ts'

function previousDay(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day - 1))

  return [
    date.getUTCFullYear().toString().padStart(4, '0'),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCDate().toString().padStart(2, '0'),
  ].join('-')
}

export function calculateStreak(logs: Log[], today: string): number {
  const doneDates = new Set<string>()

  for (const log of logs) {
    if (log.status === 'done' && log.date <= today) {
      doneDates.add(log.date)
    }
  }

  let currentDate = doneDates.has(today) ? today : previousDay(today)
  let streak = 0

  while (doneDates.has(currentDate)) {
    streak += 1
    currentDate = previousDay(currentDate)
  }

  return streak
}