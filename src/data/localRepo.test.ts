import { describe, expect, it } from 'vitest'
import type { Goal, Log } from '../types.ts'
import { createLocalRepo } from './localRepo.ts'

function createStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map<string, string>()

  return {
    getItem(key: string): string | null {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      values.set(key, value)
    },
  }
}

function createGoal(title: string): Omit<Goal, 'id'> {
  return {
    title,
    kind: 'skill',
    frequency: 'daily',
    createdAt: '2026-10-11',
  }
}

function createLog(goalId: string, date: string): Omit<Log, 'id'> {
  return {
    goalId,
    date,
    status: 'done',
    minutes: 30,
    workedOn: 'Practice',
    topics: [],
  }
}

describe('createLocalRepo', () => {
  it('returns empty arrays for a new repo', async () => {
    const repo = createLocalRepo(createStorage())

    expect(await repo.getGoals()).toEqual([])
    expect(await repo.getLogs()).toEqual([])
  })

  it('adds a goal with a generated id', async () => {
    const repo = createLocalRepo(createStorage())
    const goal = await repo.addGoal(createGoal('Learn TypeScript'))

    expect(goal).toMatchObject(createGoal('Learn TypeScript'))
    expect(goal.id).toEqual(expect.any(String))
    expect(await repo.getGoals()).toEqual([goal])
  })

  it('returns undefined for an unknown goal id', async () => {
    const repo = createLocalRepo(createStorage())

    expect(await repo.getGoal('missing')).toBeUndefined()
  })

  it('filters logs by goal id', async () => {
    const repo = createLocalRepo(createStorage())
    const firstLog = await repo.addLog(createLog('goal-1', '2026-10-11'))
    await repo.addLog(createLog('goal-2', '2026-10-11'))

    expect(await repo.getLogs('goal-1')).toEqual([firstLog])
  })

  it('returns all logs when no goal id is provided', async () => {
    const repo = createLocalRepo(createStorage())
    const firstLog = await repo.addLog(createLog('goal-1', '2026-10-11'))
    const secondLog = await repo.addLog(createLog('goal-2', '2026-10-12'))

    expect(await repo.getLogs()).toEqual([firstLog, secondLog])
  })

  it('persists data across repos using the same storage', async () => {
    const storage = createStorage()
    const firstRepo = createLocalRepo(storage)
    const secondRepo = createLocalRepo(storage)
    const goal = await firstRepo.addGoal(createGoal('Read'))
    const log = await firstRepo.addLog(createLog(goal.id, '2026-10-11'))

    expect(await secondRepo.getGoals()).toEqual([goal])
    expect(await secondRepo.getLogs()).toEqual([log])
  })

  it('returns empty arrays for corrupted or non-array JSON', async () => {
    const storage = createStorage()
    storage.setItem('habit-coach:goals', '{not valid json')
    storage.setItem('habit-coach:logs', JSON.stringify({ logs: [] }))
    const repo = createLocalRepo(storage)

    await expect(repo.getGoals()).resolves.toEqual([])
    await expect(repo.getLogs()).resolves.toEqual([])
  })

  it('generates unique ids across several logs', async () => {
    const repo = createLocalRepo(createStorage())
    const logs = await Promise.all([
      repo.addLog(createLog('goal-1', '2026-10-11')),
      repo.addLog(createLog('goal-1', '2026-10-12')),
      repo.addLog(createLog('goal-1', '2026-10-13')),
    ])

    expect(new Set(logs.map((log) => log.id)).size).toBe(logs.length)
  })
})
