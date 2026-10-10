import type { Log } from '../types.ts'

export function totalMinutes(logs: Log[]): number {
  return logs.reduce(
    (total, log) =>
      log.status === 'done' || log.status === 'partial'
        ? total + log.minutes
        : total,
    0,
  )
}