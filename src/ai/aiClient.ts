import type { Goal, Insight, Log } from '../types.ts'
import { createMockAi } from './mockAi.ts'

export type CoachInput = {
  goal: Goal
  logs: readonly Log[]
  today: string
}

export interface AiClient {
  coachReply(input: CoachInput): Promise<Insight>
}

export const aiClient: AiClient = createMockAi()