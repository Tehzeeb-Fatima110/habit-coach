export type Goal = {
  id: string
  title: string
  kind: 'skill' | 'habit'
  frequency: 'daily' | 'weekdays' | 'custom'
  endGoal?: string
  minimumVersion?: string
  createdAt: string
}

export type Log = {
  id: string
  goalId: string
  date: string
  status: 'done' | 'partial' | 'skipped'
  minutes: number
  workedOn: string
  how?: string
  achieved?: string
  topics: string[]
}

export type Insight = {
  patternFlag: string | null
  tone: 'encouraging' | 'blunt' | 'neutral'
  message: string
  riskLevel: 'low' | 'medium' | 'high'
}