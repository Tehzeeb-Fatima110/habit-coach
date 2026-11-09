import { zodResolver } from '@hookform/resolvers/zod'
import { type BaseSyntheticEvent, useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import type { AiClient } from '../ai/aiClient.ts'
import { aiClient as defaultAiClient } from '../ai/aiClient.ts'
import Button from '../components/ui/Button.tsx'
import Card from '../components/ui/Card.tsx'
import { repo as defaultRepo } from '../data/localRepo.ts'
import type { Repo } from '../data/repo.ts'
import { toDateString } from '../lib/dates.ts'
import { calculateStreak } from '../lib/streak.ts'
import type { Goal, Insight, Log } from '../types.ts'

type DashboardProps = {
  repo?: Repo
  ai?: AiClient
  now?: () => Date
}

type LogFormValues = {
  minutes: number
  workedOn: string
}

const logFormSchema = z.object({
  minutes: z.number().finite().min(0).max(960),
  workedOn: z.string().trim(),
})

type GoalCardProps = {
  goal: Goal
  logs: Log[]
  insight: Insight
  today: string
  repo: Repo
  onLogAdded: (goalId: string) => Promise<void>
}

function formatFrequency(frequency: Goal['frequency']): string {
  return frequency === 'weekdays'
    ? 'Weekdays'
    : frequency.charAt(0).toUpperCase() + frequency.slice(1)
}

function GoalCard({ goal, logs, insight, today, repo, onLogAdded }: GoalCardProps) {
  const [saveError, setSaveError] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      minutes: 30,
      workedOn: 'Practice',
    },
  })

  const totalMinutes = logs.reduce((total, log) => total + log.minutes, 0)
  const streak = calculateStreak(logs, today)

  const onSubmit = async (
    values: LogFormValues,
    event?: BaseSyntheticEvent,
  ): Promise<void> => {
    const submitter =
      event?.nativeEvent instanceof SubmitEvent
        ? event.nativeEvent.submitter
        : null
    const status = submitter?.getAttribute('value')
    if (status !== 'done' && status !== 'partial' && status !== 'skipped') {
      return
    }

    setSaveError(undefined)
    try {
      await repo.addLog({
        goalId: goal.id,
        date: today,
        status,
        minutes: values.minutes,
        workedOn: values.workedOn.trim() || 'Practice',
        topics: [],
      })
      await onLogAdded(goal.id)
    } catch {
      setSaveError('Unable to save this log. Please try again.')
    }
  }

  return (
    <Card className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-xl font-bold tracking-tight text-gray-900">
            {goal.title}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-accent-50 px-2.5 py-1 text-accent-800">
              {goal.kind === 'skill' ? 'Skill' : 'Habit'}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              {formatFrequency(goal.frequency)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">Streak</span>
            <br />
            {streak} {streak === 1 ? 'day' : 'days'}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Total time</span>
            <br />
            {totalMinutes} minutes
          </p>
        </div>
      </header>

      <section className="space-y-2" aria-label={`${goal.title} coach insight`}>
        <p className="leading-6 text-gray-700">{insight.message}</p>
        {insight.patternFlag !== null && (
          <p className="text-sm font-semibold text-gray-800">{insight.patternFlag}</p>
        )}
        <p className="text-sm font-semibold text-gray-800">
          Risk: {insight.riskLevel === 'low'
            ? 'Low risk'
            : insight.riskLevel === 'medium'
              ? 'Medium risk'
              : 'High risk'}
        </p>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Quick log</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`minutes-${goal.id}`} className="mb-1 block text-sm font-semibold text-gray-800">
              Minutes
            </label>
            <input
              id={`minutes-${goal.id}`}
              type="number"
              min="0"
              max="960"
              {...register('minutes', { valueAsNumber: true })}
              className="w-full rounded-control border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
            />
          </div>
          <div>
            <label htmlFor={`worked-on-${goal.id}`} className="mb-1 block text-sm font-semibold text-gray-800">
              What did you work on?
            </label>
            <input
              id={`worked-on-${goal.id}`}
              type="text"
              {...register('workedOn')}
              className="w-full rounded-control border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
            />
          </div>
        </div>
        {saveError !== undefined && (
          <p role="alert" className="text-sm font-semibold text-danger-700">{saveError}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {(['done', 'partial', 'skipped'] as const).map((status) => (
            <Button
              key={status}
              type="submit"
              variant={status === 'done' ? 'primary' : 'secondary'}
              loading={isSubmitting}
              aria-label={`Mark ${goal.title} as ${status}`}
              value={status}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </form>
    </Card>
  )
}

function Dashboard({
  repo = defaultRepo,
  ai = defaultAiClient,
  now = () => new Date(),
}: DashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [logsByGoal, setLogsByGoal] = useState<Record<string, Log[]>>({})
  const [insights, setInsights] = useState<Record<string, Insight>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [today] = useState(() => toDateString(now()))

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(undefined)
    try {
      const [loadedGoals, allLogs] = await Promise.all([repo.getGoals(), repo.getLogs()])
      const sortedGoals = [...loadedGoals].sort((first, second) =>
        second.createdAt.localeCompare(first.createdAt),
      )
      const nextLogsByGoal: Record<string, Log[]> = {}
      for (const goal of sortedGoals) {
        nextLogsByGoal[goal.id] = allLogs.filter((log) => log.goalId === goal.id)
      }
      const nextInsights = await Promise.all(
        sortedGoals.map(async (goal) => [
          goal.id,
          await ai.coachReply({ goal, logs: nextLogsByGoal[goal.id], today }),
        ] as const),
      )
      setGoals(sortedGoals)
      setLogsByGoal(nextLogsByGoal)
      setInsights(Object.fromEntries(nextInsights))
    } catch {
      setError('Unable to load your dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [ai, repo, today])

  useEffect(() => {
    void load()
  }, [load])

  const refreshGoal = useCallback(async (goalId: string): Promise<void> => {
    const goal = goals.find((item) => item.id === goalId)
    if (goal === undefined) {
      return
    }
    const logs = await repo.getLogs(goalId)
    const insight = await ai.coachReply({ goal, logs, today })
    setLogsByGoal((current) => ({ ...current, [goalId]: logs }))
    setInsights((current) => ({ ...current, [goalId]: insight }))
  }, [ai, goals, repo, today])

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <Link
          to="/goals/new"
          className="inline-flex min-h-10 items-center rounded-control bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
        >
          New goal
        </Link>
      </header>

      {loading && <p role="status" className="text-gray-700">Loading your goals...</p>}
      {!loading && error !== undefined && (
        <Card className="space-y-4">
          <p role="alert" className="text-gray-800">{error}</p>
          <Button type="button" onClick={() => void load()}>Try again</Button>
        </Card>
      )}
      {!loading && error === undefined && goals.length === 0 && (
        <Card className="space-y-3 text-center">
          <h2 className="text-xl font-bold text-gray-900">No goals yet</h2>
          <p className="text-gray-700">Create your first goal to start building momentum.</p>
          <Link to="/goals/new" className="font-semibold text-accent-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600">
            Create a new goal
          </Link>
        </Card>
      )}
      {!loading && error === undefined && goals.length > 0 && (
        <ul className="space-y-6">
          {goals.map((goal) => (
            <li key={goal.id}>
              {insights[goal.id] !== undefined && (
                <GoalCard
                  goal={goal}
                  logs={logsByGoal[goal.id] ?? []}
                  insight={insights[goal.id]}
                  today={today}
                  repo={repo}
                  onLogAdded={refreshGoal}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dashboard
