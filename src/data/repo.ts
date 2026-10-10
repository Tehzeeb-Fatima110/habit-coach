import type { Goal, Log } from '../types.ts'

export interface Repo {
  getGoals(): Promise<Goal[]>
  getGoal(id: string): Promise<Goal | undefined>
  addGoal(goal: Omit<Goal, 'id'>): Promise<Goal>
  getLogs(goalId?: string): Promise<Log[]>
  addLog(log: Omit<Log, 'id'>): Promise<Log>
}