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
})
