import type { AiClient, CoachInput } from './aiClient.ts'
import { addDays, weekdayOf } from '../lib/dates.ts'
import { calculateStreak } from '../lib/streak.ts'
import type { Insight, Log } from '../types.ts'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function dateAsUtcTime(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function daysBetween(start: string, end: string): number {
  return Math.round((dateAsUtcTime(end) - dateAsUtcTime(start)) / 86_400_000)
}

function sortNewestFirst(logs: Log[]): Log[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date))
}

function getPatternFlag(logs: Log[], today: string): string | null {
  const firstDate = addDays(today, -27)
  const skippedLogs = logs.filter(
    (log) =>
      log.status === 'skipped' &&
      log.date >= firstDate &&
      log.date <= today,
  )
  const counts = new Map<number, number>()

  for (const log of skippedLogs) {
    const weekday = weekdayOf(log.date)
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1)
  }

  for (const [weekday, count] of counts) {
    if (count >= 3) {
      return `You often skip on ${WEEKDAYS[weekday]}s`
    }
  }

  return null
}

function buildMessage(
  title: string,
  streak: number,
  tone: Insight['tone'],
  riskLevel: Insight['riskLevel'],
  minimumVersion: string | undefined,
  hasLogs: boolean,
): string {
  if (!hasLogs) {
    return `Start your first log for ${title} today. Your current streak is ${streak} days. Small steps build a lasting practice.`
  }

  const messages: Record<Insight['tone'], string> = {
    encouraging: `Great momentum on ${title}: you're on a ${streak}-day streak. Keep building on it.`,
    blunt: `${title} needs attention: your current streak is ${streak} days. Make the next session count.`,
    neutral: `Keep moving with ${title}: your current streak is ${streak} days. A small step today is enough.`,
  }
  const minimumVersionMessage =
    riskLevel !== 'low' && minimumVersion !== undefined
      ? ` On difficult days, aim for your minimum version: ${minimumVersion}.`
      : ''

  return messages[tone] + minimumVersionMessage
}

export function buildInsight(input: CoachInput): Insight {
  const goalLogs = input.logs.filter((log) => log.goalId === input.goal.id)
  const sortedLogs = sortNewestFirst(goalLogs)
  const streak = calculateStreak(goalLogs, input.today)
  const mostRecentDone = sortedLogs.find(
    (log) => log.status === 'done' && log.date <= input.today,
  )
  const daysSinceLastDone =
    mostRecentDone === undefined
      ? null
      : daysBetween(mostRecentDone.date, input.today)
  let consecutiveSkips = 0
  for (const log of sortedLogs) {
    if (log.status !== 'skipped') {
      break
    }
    consecutiveSkips += 1
  }
  const tone: Insight['tone'] =
    streak >= 5
      ? 'encouraging'
      : (daysSinceLastDone === null && goalLogs.length >= 2) ||
          (daysSinceLastDone !== null && daysSinceLastDone >= 2)
        ? 'blunt'
        : 'neutral'
  const riskLevel: Insight['riskLevel'] =
    (daysSinceLastDone !== null && daysSinceLastDone >= 3) ||
    consecutiveSkips >= 2
      ? 'high'
      : (daysSinceLastDone === 2 || consecutiveSkips === 1)
        ? 'medium'
        : 'low'

  return {
    patternFlag: getPatternFlag(goalLogs, input.today),
    tone,
    message: buildMessage(
      input.goal.title,
      streak,
      tone,
      riskLevel,
      input.goal.minimumVersion,
      goalLogs.length > 0,
    ),
    riskLevel,
  }
}

export function createMockAi(): AiClient {
  return {
    async coachReply(input: CoachInput): Promise<Insight> {
      return buildInsight(input)
    },
  }
}