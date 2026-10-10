import { describe, expect, it } from 'vitest'
import type { Log } from '../types.ts'
import { totalMinutes } from './hours.ts'

function createLog(status: Log['status'], minutes: number): Log {
  return {
    id: `${status}-${minutes}`,
    goalId: 'goal-1',
    date: '2026-03-04',
    status,
    minutes,
    workedOn: 'Practice',
    topics: [],
  }
}

describe('totalMinutes', () => {
  it('returns zero for an empty array', () => {
    expect(totalMinutes([])).toBe(0)
  })

  it('sums done and partial logs', () => {
    expect(totalMinutes([createLog('done', 30), createLog('partial', 15)])).toBe(45)
  })

  it('excludes skipped logs', () => {
    expect(
      totalMinutes([
        createLog('done', 30),
        createLog('partial', 15),
        createLog('skipped', 60),
      ]),
    ).toBe(45)
  })
})
