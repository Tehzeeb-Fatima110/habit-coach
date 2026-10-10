import type { Goal, Log } from '../types.ts'
import type { Repo } from './repo.ts'

const GOALS_KEY = 'habit-coach:goals'
const LOGS_KEY = 'habit-coach:logs'

function readArray<T>(storage: Pick<Storage, 'getItem' | 'setItem'>, key: string): T[] {
  const stored = storage.getItem(key)
  if (stored === null) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

export function createLocalRepo(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): Repo {
  return {
    async getGoals(): Promise<Goal[]> {
      return readArray<Goal>(storage, GOALS_KEY)
    },

    async getGoal(id: string): Promise<Goal | undefined> {
      const goals = readArray<Goal>(storage, GOALS_KEY)
      return goals.find((goal) => goal.id === id)
    },

    async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
      const newGoal: Goal = {
        ...goal,
        id: crypto.randomUUID(),
      }
      const goals = readArray<Goal>(storage, GOALS_KEY)
      goals.push(newGoal)
      storage.setItem(GOALS_KEY, JSON.stringify(goals))
      return newGoal
    },

    async getLogs(goalId?: string): Promise<Log[]> {
      const logs = readArray<Log>(storage, LOGS_KEY)
      return goalId === undefined
        ? logs
        : logs.filter((log) => log.goalId === goalId)
    },

    async addLog(log: Omit<Log, 'id'>): Promise<Log> {
      const newLog: Log = {
        ...log,
        id: crypto.randomUUID(),
      }
      const logs = readArray<Log>(storage, LOGS_KEY)
      logs.push(newLog)
      storage.setItem(LOGS_KEY, JSON.stringify(logs))
      return newLog
    },
  }
}

export const repo: Repo = createLocalRepo(window.localStorage)