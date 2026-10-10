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

  it('returns the matching goal when the id exists', async () => {
    const repo = createLocalRepo(createStorage())
    await repo.addGoal(createGoal('First goal'))
    const secondGoal = await repo.addGoal(createGoal('Second goal'))

    expect(await repo.getGoal(secondGoal.id)).toEqual(secondGoal)
  })

  it('keeps all logs after three concurrent addLog calls', async () => {
    const repo = createLocalRepo(createStorage())
    const logs = await Promise.all([
      repo.addLog(createLog('goal-1', '2026-10-11')),
      repo.addLog(createLog('goal-1', '2026-10-12')),
      repo.addLog(createLog('goal-1', '2026-10-13')),
    ])

    expect(await repo.getLogs()).toHaveLength(3)
    expect(await repo.getLogs()).toEqual(expect.arrayContaining(logs))
  })

  it('adds a goal when the stored goals JSON is corrupted', async () => {
    const storage = createStorage()
    storage.setItem('habit-coach:goals', '{not valid json')
    const repo = createLocalRepo(storage)
    const goal = await repo.addGoal(createGoal('Recovered goal'))

    expect(await repo.getGoals()).toEqual([goal])
  })

  it('filters malformed elements from a valid goals array', async () => {
    const storage = createStorage()
    storage.setItem(
      'habit-coach:goals',
      JSON.stringify([1, 'x', null, { title: 5 }]),
    )
    const repo = createLocalRepo(storage)

    await expect(repo.getGoals()).resolves.toEqual([])
  })

  it('returns empty arrays when storage getItem throws', async () => {
    const storage: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem(): string | null {
        throw new Error('read failed')
      },
      setItem(): void {},
    }
    const repo = createLocalRepo(storage)

    await expect(repo.getGoals()).resolves.toEqual([])
    await expect(repo.getLogs()).resolves.toEqual([])
  })

  it('rejects when storage setItem throws while adding a goal', async () => {
    const storage: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem(): string | null {
        return null
      },
      setItem(): void {
        throw new Error('write failed')
      },
    }
    const repo = createLocalRepo(storage)

    await expect(repo.addGoal(createGoal('Unsaved goal'))).rejects.toThrow(Error)
  })

  it('filters malformed elements from a valid logs array', async () => {
    const storage = createStorage()
    const validLog = {
      ...createLog('goal-1', '2026-10-11'),
      id: 'log-1',
    }
    storage.setItem(
      'habit-coach:logs',
      JSON.stringify([validLog, 1, null]),
    )
    const repo = createLocalRepo(storage)
    const logs = await repo.getLogs()

    expect(logs).toHaveLength(1)
    expect(logs[0]).toEqual(validLog)
  })

  it('returns valid goals mixed with malformed elements', async () => {
    const storage = createStorage()
    const validGoal = {
      ...createGoal('Valid goal'),
      id: 'goal-1',
    }
    storage.setItem(
      'habit-coach:goals',
      JSON.stringify([validGoal, 1, 'x', null, { title: 5 }]),
    )
    const repo = createLocalRepo(storage)

    await expect(repo.getGoals()).resolves.toEqual([validGoal])
  })
})
