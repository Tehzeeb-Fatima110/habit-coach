import { describe, expect, it } from 'vitest'
import type { Goal, Log } from '../types.ts'
import { buildInsight } from './mockAi.ts'

const goal: Goal = {
  id: 'goal-1',
  title: 'Learn React',
  kind: 'skill',
  frequency: 'daily',
  createdAt: '2026-01-01',
}

function log(
  date: string,
  status: Log['status'],
  goalId = goal.id,
): Log {
  return {
    id: `${goalId}-${date}-${status}`,
    goalId,
    date,
    status,
    minutes: 20,
    workedOn: 'Practice',
    topics: [],
  }
}

function insight(logs: Log[], today = '2026-03-14', currentGoal = goal): ReturnType<typeof buildInsight> {
  return buildInsight({ goal: currentGoal, logs, today })
}

describe('buildInsight', () => {
  it('encourages a first log when there are no logs', () => {
    const result = insight([])

    expect(result).toEqual({
      patternFlag: null,
      tone: 'neutral',
      riskLevel: 'low',
      message: expect.stringContaining('Learn React'),
    })
    expect(result.message).toContain('0 days')
  })

  it('uses an encouraging tone for a five-day streak', () => {
    const logs = ['2026-03-14', '2026-03-13', '2026-03-12', '2026-03-11', '2026-03-10']
      .map((date) => log(date, 'done'))

    expect(insight(logs).tone).toBe('encouraging')
    expect(insight(logs).riskLevel).toBe('low')
    expect(insight(logs).message).toContain('5-day streak')
  })

  it('uses blunt medium-risk coaching after two days', () => {
    const result = insight([log('2026-03-12', 'done')])

    expect(result.tone).toBe('blunt')
    expect(result.riskLevel).toBe('medium')
  })

  it('uses high risk after three days since the last done log', () => {
    const result = insight([log('2026-03-11', 'done')])

    expect(result.riskLevel).toBe('high')
  })

  it('marks one newest skipped log as medium risk', () => {
    const result = insight([log('2026-03-14', 'skipped')])

    expect(result.riskLevel).toBe('medium')
    expect(result.tone).toBe('neutral')
  })

  it('marks two consecutive skipped logs as high risk', () => {
    const result = insight([
      log('2026-03-14', 'skipped'),
      log('2026-03-13', 'skipped'),
    ])

    expect(result.riskLevel).toBe('high')
  })

  it('flags three Friday skips within 28 days', () => {
    const result = insight([
      log('2026-03-13', 'skipped'),
      log('2026-03-06', 'skipped'),
      log('2026-02-27', 'skipped'),
    ])

    expect(result.patternFlag).toBe('You often skip on Fridays')
  })

  it('does not flag a weekday when one skip is older than 28 days', () => {
    const result = insight([
      log('2026-03-13', 'skipped'),
      log('2026-03-06', 'skipped'),
      log('2026-02-13', 'skipped'),
    ])

    expect(result.patternFlag).toBeNull()
  })

  it('ignores logs from another goal', () => {
    const result = insight([log('2026-03-11', 'done', 'other-goal')])

    expect(result.tone).toBe('neutral')
    expect(result.riskLevel).toBe('low')
    expect(result.message).toContain('first log')
  })

  it('includes the minimum-version sentence only above low risk', () => {
    const goalWithMinimum: Goal = { ...goal, minimumVersion: '10 minute walk' }

    expect(insight([], '2026-03-14', goalWithMinimum).message).not.toContain('minimum version')
    expect(insight([log('2026-03-11', 'done')], '2026-03-14', goalWithMinimum).message)
      .toContain('minimum version: 10 minute walk')
  })

  it('returns the same result regardless of log order', () => {
    const oldestFirst = [
      log('2026-03-13', 'skipped'),
      log('2026-03-14', 'skipped'),
    ]
    const newestFirst = [...oldestFirst].reverse()

    expect(insight(oldestFirst)).toEqual(insight(newestFirst))
  })

  it('does not mutate its input logs', () => {
    const logs = [
      log('2026-03-13', 'skipped'),
      log('2026-03-14', 'skipped'),
    ]
    const originalOrder = [...logs]
    const frozenLogs = Object.freeze([...logs])

    expect(() => buildInsight({
      goal,
      logs: frozenLogs,
      today: '2026-03-14',
    })).not.toThrow()
    expect(frozenLogs).toEqual(originalOrder)
  })

  it('stops the skip run at the first non-skipped log', () => {
    const result = insight([
      log('2026-03-14', 'skipped'),
      log('2026-03-13', 'done'),
      log('2026-03-12', 'skipped'),
    ])

    expect(result.riskLevel).toBe('medium')
  })

  it('gives consecutive skips high risk over a medium days-since risk', () => {
    const result = insight([
      log('2026-03-12', 'done'),
      log('2026-03-13', 'skipped'),
      log('2026-03-14', 'skipped'),
    ])

    expect(result.riskLevel).toBe('high')
    expect(result.tone).toBe('blunt')
  })

  it('uses a blunt tone when two logs have never been done', () => {
    const result = insight([
      log('2026-03-14', 'skipped'),
      log('2026-03-13', 'skipped'),
    ])

    expect(result.tone).toBe('blunt')
  })

  it('keeps exactly four consecutive done days neutral and low risk', () => {
    const logs = ['2026-03-14', '2026-03-13', '2026-03-12', '2026-03-11']
      .map((date) => log(date, 'done'))

    expect(insight(logs).tone).toBe('neutral')
    expect(insight(logs).riskLevel).toBe('low')
  })

  it('keeps a done log from yesterday neutral and low risk', () => {
    const result = insight([log('2026-03-13', 'done')])

    expect(result.tone).toBe('neutral')
    expect(result.riskLevel).toBe('low')
  })

  it('keeps a skipped today after a done yesterday medium risk and neutral', () => {
    const result = insight([
      log('2026-03-13', 'done'),
      log('2026-03-14', 'skipped'),
    ])

    expect(result.riskLevel).toBe('medium')
    expect(result.tone).toBe('neutral')
  })

  it('does not flag partial or done Friday logs as a skip pattern', () => {
    expect(insight([
      log('2026-03-13', 'partial'),
      log('2026-03-06', 'partial'),
      log('2026-02-27', 'partial'),
    ]).patternFlag).toBeNull()
    expect(insight([
      log('2026-03-13', 'skipped'),
      log('2026-03-06', 'skipped'),
      log('2026-02-27', 'done'),
    ]).patternFlag).toBeNull()
  })

  it('includes the 27-day-back Sunday in the pattern window', () => {
    expect(insight([
      log('2026-03-08', 'skipped'),
      log('2026-03-01', 'skipped'),
      log('2026-02-15', 'skipped'),
    ]).patternFlag).toBe('You often skip on Sundays')
  })

  it('excludes the 28-day-back Saturday from the pattern window', () => {
    expect(insight([
      log('2026-03-14', 'skipped'),
      log('2026-03-07', 'skipped'),
      log('2026-02-14', 'skipped'),
    ]).patternFlag).toBeNull()
  })

  it('flags three Saturday skips inside the pattern window', () => {
    expect(insight([
      log('2026-03-14', 'skipped'),
      log('2026-03-07', 'skipped'),
      log('2026-02-28', 'skipped'),
    ]).patternFlag).toBe('You often skip on Saturdays')
  })

  it('returns the first matching weekday when multiple patterns qualify', () => {
    expect(insight([
      log('2026-03-13', 'skipped'),
      log('2026-03-06', 'skipped'),
      log('2026-02-27', 'skipped'),
      log('2026-02-20', 'skipped'),
      log('2026-03-09', 'skipped'),
      log('2026-03-02', 'skipped'),
      log('2026-02-23', 'skipped'),
    ]).patternFlag).toBe('You often skip on Fridays')
  })

  it('does not mention a minimum version when none is set', () => {
    const result = insight([log('2026-03-11', 'done')])

    expect(result.message).not.toContain('undefined')
    expect(result.message).not.toContain('minimum version')
  })

  it('does not mention a minimum version at low risk', () => {
    const goalWithMinimum: Goal = { ...goal, minimumVersion: '10 minute walk' }
    const logs = ['2026-03-14', '2026-03-13', '2026-03-12', '2026-03-11', '2026-03-10']
      .map((date) => log(date, 'done'))

    expect(insight(logs, '2026-03-14', goalWithMinimum).message)
      .not.toContain('minimum version')
  })

  it('ignores a done log dated after today', () => {
    expect(insight([log('2026-03-20', 'done')]))
      .toEqual(insight([]))
  })

  it('ignores skipped logs from another goal', () => {
    const result = insight([
      log('2026-03-14', 'skipped', 'other-goal'),
      log('2026-03-13', 'skipped', 'other-goal'),
    ])

    expect(result.riskLevel).toBe('low')
    expect(result.tone).toBe('neutral')
    expect(result.patternFlag).toBeNull()
  })

  it('treats a done and skipped log on one date as a done day in either order', () => {
    const skippedThenDone = [
      log('2026-03-14', 'skipped'),
      log('2026-03-14', 'done'),
    ]
    const doneThenSkipped = [...skippedThenDone].reverse()

    expect(insight(skippedThenDone)).toEqual(insight(doneThenSkipped))
    expect(insight(skippedThenDone).riskLevel).toBe('low')
  })

  it('counts duplicate skipped logs on one date as one skipped day', () => {
    const result = insight([
      log('2026-03-14', 'skipped'),
      log('2026-03-14', 'skipped'),
    ])

    expect(result.riskLevel).toBe('medium')
  })

  it('does not flag duplicate skipped logs on one date as three dates', () => {
    const result = insight([
      log('2026-03-13', 'skipped'),
      log('2026-03-13', 'skipped'),
      log('2026-03-13', 'skipped'),
    ])

    expect(result.patternFlag).toBeNull()
  })

  it('does not mention an empty minimum version', () => {
    const goalWithEmptyMinimum: Goal = { ...goal, minimumVersion: '' }
    const result = insight([log('2026-03-11', 'done')], '2026-03-14', goalWithEmptyMinimum)

    expect(result.message).not.toContain('minimum version')
    expect(result.message).not.toContain('undefined')
  })
})
