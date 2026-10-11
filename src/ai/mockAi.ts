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

function sortNewestFirst(logs: readonly Log[]): Log[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date))
}

function getSkippedDays(logs: readonly Log[]): Set<string> {
  const logsByDate = new Map<string, Log[]>()

  for (const log of logs) {
    const logsForDate = logsByDate.get(log.date) ?? []
    logsForDate.push(log)
    logsByDate.set(log.date, logsForDate)
  }

  const skippedDays = new Set<string>()
  for (const [date, logsForDate] of logsByDate) {
    if (logsForDate.every((log) => log.status === 'skipped')) {
      skippedDays.add(date)
    }
  }

  return skippedDays
}

function getPatternFlag(logs: readonly Log[], today: string): string | null {
  const firstDate = addDays(today, -27)
  const skippedDays = getSkippedDays(logs)
  const counts = new Map<number, { count: number; latestDate: string }>()

  for (const date of skippedDays) {
    if (date < firstDate || date > today) {
      continue
    }

    const weekday = weekdayOf(date)
    const current = counts.get(weekday)
    counts.set(weekday, {
      count: (current?.count ?? 0) + 1,
      latestDate: current === undefined || date > current.latestDate
        ? date
        : current.latestDate,
    })
  }

  let selectedWeekday: number | undefined
  let selectedCount = 0
  let selectedLatestDate = ''
  for (const [weekday, details] of counts) {
    if (
      details.count >= 3 &&
      (details.count > selectedCount ||
        (details.count === selectedCount && details.latestDate > selectedLatestDate))
    ) {
      selectedWeekday = weekday
      selectedCount = details.count
      selectedLatestDate = details.latestDate
    }
  }

  return selectedWeekday === undefined
    ? null
    : `You often skip on ${WEEKDAYS[selectedWeekday]}s`
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
  const trimmedMinimumVersion = minimumVersion?.trim()
  const minimumVersionMessage =
    riskLevel !== 'low' && trimmedMinimumVersion !== undefined && trimmedMinimumVersion !== ''
      ? ` On difficult days, aim for your minimum version: ${trimmedMinimumVersion}.`
      : ''

  return messages[tone] + minimumVersionMessage
}

export function buildInsight(input: CoachInput): Insight {
  const goalLogs = input.logs.filter(
    (log) => log.goalId === input.goal.id && log.date <= input.today,
  )
  const sortedLogs = sortNewestFirst(goalLogs)
  const skippedDays = getSkippedDays(goalLogs)
  const streak = calculateStreak(goalLogs, input.today)
  const mostRecentDone = sortedLogs.find(
    (log) => log.status === 'done' && log.date <= input.today,
  )
  const daysSinceLastDone =
    mostRecentDone === undefined
      ? null
      : daysBetween(mostRecentDone.date, input.today)
  let consecutiveSkips = 0
  const distinctDates = [...new Set(sortedLogs.map((log) => log.date))]
  for (const date of distinctDates) {
    if (!skippedDays.has(date)) {
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