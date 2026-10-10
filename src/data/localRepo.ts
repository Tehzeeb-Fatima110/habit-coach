import { z } from 'zod'
import type { Goal, Log } from '../types.ts'
import type { Repo } from './repo.ts'

const GOALS_KEY = 'habit-coach:goals'
const LOGS_KEY = 'habit-coach:logs'

const GoalSchema: z.ZodType<Goal> = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(['skill', 'habit']),
  frequency: z.enum(['daily', 'weekdays', 'custom']),
  endGoal: z.string().optional(),
  minimumVersion: z.string().optional(),
  createdAt: z.string(),
})

const LogSchema: z.ZodType<Log> = z.object({
  id: z.string(),
  goalId: z.string(),
  date: z.string(),
  status: z.enum(['done', 'partial', 'skipped']),
  minutes: z.number(),
  workedOn: z.string(),
  how: z.string().optional(),
  achieved: z.string().optional(),
  topics: z.array(z.string()),
})

function readArray<T>(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  key: string,
  schema: z.ZodType<T>,
): T[] {
  try {
    const stored = storage.getItem(key)
    if (stored === null) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.flatMap((item: unknown) => {
      const result = schema.safeParse(item)
      return result.success ? [result.data] : []
    })
  } catch {
    return []
  }
}

export function createLocalRepo(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): Repo {
  return {
    async getGoals(): Promise<Goal[]> {
      return readArray(storage, GOALS_KEY, GoalSchema)
    },

    async getGoal(id: string): Promise<Goal | undefined> {
      const goals = readArray(storage, GOALS_KEY, GoalSchema)
      return goals.find((goal) => goal.id === id)
    },

    async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
      const newGoal: Goal = {
        ...goal,
        id: crypto.randomUUID(),
      }
      const goals = readArray(storage, GOALS_KEY, GoalSchema)
      goals.push(newGoal)
      storage.setItem(GOALS_KEY, JSON.stringify(goals))
      return newGoal
    },

    async getLogs(goalId?: string): Promise<Log[]> {
      const logs = readArray(storage, LOGS_KEY, LogSchema)
      return goalId === undefined
        ? logs
        : logs.filter((log) => log.goalId === goalId)
    },

    async addLog(log: Omit<Log, 'id'>): Promise<Log> {
      const newLog: Log = {
        ...log,
        id: crypto.randomUUID(),
      }
      const logs = readArray(storage, LOGS_KEY, LogSchema)
      logs.push(newLog)
      storage.setItem(LOGS_KEY, JSON.stringify(logs))
      return newLog
    },
  }
}

export const repo: Repo = createLocalRepo(window.localStorage)