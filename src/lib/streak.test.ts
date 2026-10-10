import { describe, expect, it } from 'vitest'
import type { Log } from '../types.ts'
import { calculateStreak } from './streak.ts'

function createLog(
  date: string,
  status: Log['status'] = 'done',
  id = date,
): Log {
  return {
    id,
    goalId: 'goal-1',
    date,
    status,
    minutes: 30,
    workedOn: 'Practice',
    topics: [],
  }
}

describe('calculateStreak', () => {
  it('returns zero for an empty array', () => {
    expect(calculateStreak([], '2026-03-04')).toBe(0)
  })

  it('counts three consecutive done days', () => {
    const logs = [
      createLog('2026-03-04'),
      createLog('2026-03-03'),
      createLog('2026-03-02'),
    ]

    expect(calculateStreak(logs, '2026-03-04')).toBe(3)
  })

  it('breaks when there is a gap', () => {
    const logs = [createLog('2026-03-04'), createLog('2026-03-02')]

    expect(calculateStreak(logs, '2026-03-04')).toBe(1)
  })

  it('breaks on a partial day', () => {
    const logs = [
      createLog('2026-03-04'),
      createLog('2026-03-03', 'partial'),
      createLog('2026-03-02'),
    ]

    expect(calculateStreak(logs, '2026-03-04')).toBe(1)
  })

  it('counts multiple done logs on one day once', () => {
    const logs = [
      createLog('2026-03-04', 'done', 'morning'),
      createLog('2026-03-04', 'done', 'evening'),
      createLog('2026-03-03'),
    ]

    expect(calculateStreak(logs, '2026-03-04')).toBe(2)
  })

  it('starts from yesterday when today has no log', () => {
    const logs = [createLog('2026-03-03'), createLog('2026-03-02')]

    expect(calculateStreak(logs, '2026-03-04')).toBe(2)
  })

  it('handles a month boundary', () => {
    const logs = [createLog('2026-03-01'), createLog('2026-02-28'), createLog('2026-02-27')]

    expect(calculateStreak(logs, '2026-03-01')).toBe(3)
  })

  it('handles a year boundary', () => {
    const logs = [createLog('2026-01-01'), createLog('2025-12-31')]

    expect(calculateStreak(logs, '2026-01-01')).toBe(2)
  })

  it('breaks when a day has a skipped log', () => {
    const logs = [
      createLog('2026-03-04'),
      createLog('2026-03-03', 'skipped'),
      createLog('2026-03-02'),
    ]

    expect(calculateStreak(logs, '2026-03-04')).toBe(1)
  })

  it('does not break when today has only a partial log', () => {
    const logs = [createLog('2026-03-04', 'partial'), createLog('2026-03-03')]

    expect(calculateStreak(logs, '2026-03-04')).toBe(1)
  })

  it('counts a day with partial and done logs as a done day', () => {
    const logs = [
      createLog('2026-03-04', 'partial', 'partial'),
      createLog('2026-03-04', 'done', 'done'),
      createLog('2026-03-03'),
    ]

    expect(calculateStreak(logs, '2026-03-04')).toBe(2)
  })

  it('returns the same result for oldest-first logs', () => {
    const logs = [
      createLog('2026-03-02'),
      createLog('2026-03-03'),
      createLog('2026-03-04'),
    ]

    expect(calculateStreak(logs, '2026-03-04')).toBe(3)
  })

  it('returns zero when the last done log is two days before today', () => {
    const logs = [createLog('2026-03-02')]

    expect(calculateStreak(logs, '2026-03-04')).toBe(0)
  })

  it('handles leap day', () => {
    const logs = [
      createLog('2028-03-01'),
      createLog('2028-02-29'),
      createLog('2028-02-28'),
    ]

    expect(calculateStreak(logs, '2028-03-01')).toBe(3)
  })

  it('ignores logs dated after today', () => {
    const logs = [createLog('2026-03-05'), createLog('2026-03-04')]

    expect(calculateStreak(logs, '2026-03-04')).toBe(1)
  })
})
