import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import Button from '../components/ui/Button.tsx'
import Card from '../components/ui/Card.tsx'
import { repo as defaultRepo } from '../data/localRepo.ts'
import type { Repo } from '../data/repo.ts'
import { toDateString } from '../lib/dates.ts'

const goalFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(50, 'Title must be 50 characters or fewer.'),
  kind: z.enum(['skill', 'habit']),
  frequency: z.enum(['daily', 'weekdays', 'custom']),
  endGoal: z.string().max(200, 'End goal must be 200 characters or fewer.'),
  minimumVersion: z.string().max(100, 'Minimum version must be 100 characters or fewer.'),
})

type GoalFormValues = z.infer<typeof goalFormSchema>

type GoalFormProps = {
  repo?: Repo
  now?: () => Date
}

function SkillIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-accent-600" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6.5 12 3l9 3.5L12 10 3 6.5Z" />
      <path d="M6 8v5.5c0 1.7 2.7 3.5 6 3.5s6-1.8 6-3.5V8M21 7v6" />
    </svg>
  )
}

function HabitIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-accent-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11a8 8 0 0 0-14.9-4L3 10" />
      <path d="M3 5v5h5M4 13a8 8 0 0 0 14.9 4L21 14" />
      <path d="M21 19v-5h-5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m4 10 4 4 8-8" />
    </svg>
  )
}

function GoalForm({ repo = defaultRepo, now = () => new Date() }: GoalFormProps) {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const {
    register,
    handleSubmit,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      kind: 'skill',
      frequency: 'daily',
      endGoal: '',
      minimumVersion: '',
    },
  })

  const onSubmit = async (values: GoalFormValues): Promise<void> => {
    const endGoal = values.endGoal.trim()
    const minimumVersion = values.minimumVersion.trim()
    setSubmitError(undefined)

    try {
      await repo.addGoal({
        title: values.title,
        kind: values.kind,
        frequency: values.frequency,
        endGoal: endGoal || undefined,
        minimumVersion: minimumVersion || undefined,
        createdAt: toDateString(now()),
      })
      navigate('/')
    } catch {
      setSubmitError('Unable to save goal.')
    }
  }

  const onInvalid = (invalidErrors: FieldErrors<GoalFormValues>): void => {
    const firstError = Object.keys(invalidErrors)[0] as keyof GoalFormValues | undefined
    if (firstError !== undefined) {
      setFocus(firstError)
    }
  }

  const title = watch('title')

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Goal</h1>
          <p className="text-sm leading-6 text-gray-600">
            Set a clear goal and define how you want to make progress.
          </p>
        </header>

        <section className="space-y-6" aria-labelledby="basics-heading">
          <h2 id="basics-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500">The basics</h2>

          <fieldset className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-800">Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Learn React hooks"
              className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                errors.title ? 'border-danger-600' : 'border-gray-300'
              }`}
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
              {...register('title')}
            />
            <p aria-hidden="true" className="text-right text-xs text-gray-600">{title.length}/50</p>
            {errors.title && <p id="title-error" className="text-sm text-danger-700">{errors.title.message}</p>}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-800">Kind</legend>
            <span className="grid gap-3 sm:grid-cols-2">
              <span className="relative">
                <input
                  id="kind-skill"
                  type="radio"
                  value="skill"
                  className="peer absolute left-4 top-5 z-10 h-4 w-4 min-h-0 accent-accent-600"
                  aria-invalid={errors.kind ? 'true' : 'false'}
                  aria-describedby={`skill-description${errors.kind ? ' kind-error' : ''}`}
                  {...register('kind')}
                />
                <label htmlFor="kind-skill" className="flex min-h-36 cursor-pointer items-start rounded-xl border border-gray-300 p-4 pl-11 text-sm font-semibold text-gray-900 transition-colors peer-checked:border-accent-600 peer-checked:bg-accent-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <SkillIcon />
                    Skill
                  </span>
                </label>
                <p id="skill-description" className="pointer-events-none absolute left-11 right-4 top-14 text-sm leading-5 text-gray-600">
                  Something you're learning. Progress = hours and milestones.
                </p>
                <span className="pointer-events-none absolute right-3 top-3 text-accent-700 opacity-0 transition-opacity peer-checked:opacity-100">
                  <CheckIcon />
                </span>
              </span>
              <span className="relative">
                <input
                  id="kind-habit"
                  type="radio"
                  value="habit"
                  className="peer absolute left-4 top-5 z-10 h-4 w-4 min-h-0 accent-accent-600"
                  aria-invalid={errors.kind ? 'true' : 'false'}
                  aria-describedby={`habit-description${errors.kind ? ' kind-error' : ''}`}
                  {...register('kind')}
                />
                <label htmlFor="kind-habit" className="flex min-h-36 cursor-pointer items-start rounded-xl border border-gray-300 p-4 pl-11 text-sm font-semibold text-gray-900 transition-colors peer-checked:border-accent-600 peer-checked:bg-accent-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <HabitIcon />
                    Habit
                  </span>
                </label>
                <p id="habit-description" className="pointer-events-none absolute left-11 right-4 top-14 text-sm leading-5 text-gray-600">
                  Something you repeat. Progress = consistency and streaks.
                </p>
                <span className="pointer-events-none absolute right-3 top-3 text-accent-700 opacity-0 transition-opacity peer-checked:opacity-100">
                  <CheckIcon />
                </span>
              </span>
            </span>
            {errors.kind && <p id="kind-error" className="text-sm text-danger-700">{errors.kind.message}</p>}
          </fieldset>
        </section>

        <section className="space-y-6" aria-labelledby="rhythm-heading">
          <h2 id="rhythm-heading" className="text-xs font-bold uppercase tracking-wider text-gray-500">Rhythm</h2>
          <fieldset className="space-y-2">
            <label htmlFor="frequency" className="block text-sm font-semibold text-gray-800">Frequency</label>
            <select
              id="frequency"
              className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                errors.frequency ? 'border-danger-600' : 'border-gray-300'
              }`}
              aria-invalid={errors.frequency ? 'true' : 'false'}
              aria-describedby={errors.frequency ? 'frequency-error' : undefined}
              {...register('frequency')}
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="custom">Custom</option>
            </select>
            {errors.frequency && <p id="frequency-error" className="text-sm text-danger-700">{errors.frequency.message}</p>}
          </fieldset>
        </section>

        <section className="space-y-6 rounded-xl border border-accent-100 bg-accent-50 p-5 sm:p-6" aria-labelledby="stick-heading">
          <h2 id="stick-heading" className="text-xs font-bold uppercase tracking-wider text-accent-800">Make it stick</h2>

          <fieldset className="space-y-2">
            <span className="flex items-center gap-2">
              <label htmlFor="endGoal" className="text-sm font-semibold text-gray-800">End goal</label>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600">Optional</span>
            </span>
            <input
              id="endGoal"
              type="text"
              className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                errors.endGoal ? 'border-danger-600' : 'border-gray-300'
              }`}
              aria-invalid={errors.endGoal ? 'true' : 'false'}
              aria-describedby={`endGoal-help${errors.endGoal ? ' endGoal-error' : ''}`}
              {...register('endGoal')}
            />
            <p id="endGoal-help" className="text-sm text-gray-600">
              Where do you want this to lead? e.g. build a full React project.
            </p>
            {errors.endGoal && <p id="endGoal-error" className="text-sm text-danger-700">{errors.endGoal.message}</p>}
          </fieldset>

          <fieldset className="space-y-2">
            <span className="flex items-center gap-2">
              <label htmlFor="minimumVersion" className="text-sm font-semibold text-gray-800">Minimum version</label>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600">Optional</span>
            </span>
            <input
              id="minimumVersion"
              type="text"
              className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                errors.minimumVersion ? 'border-danger-600' : 'border-gray-300'
              }`}
              aria-invalid={errors.minimumVersion ? 'true' : 'false'}
              aria-describedby={`minimumVersion-help${errors.minimumVersion ? ' minimumVersion-error' : ''}`}
              {...register('minimumVersion')}
            />
            <p id="minimumVersion-help" className="text-sm text-gray-600">
              Your smallest version for low-motivation days. e.g. 10 minute walk.
            </p>
            {errors.minimumVersion && <p id="minimumVersion-error" className="text-sm text-danger-700">{errors.minimumVersion.message}</p>}
          </fieldset>
        </section>

        {submitError && (
          <p role="alert" className="rounded-lg border border-danger-600 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {submitError}
          </p>
        )}

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-control border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600">
            Cancel
          </Link>
          <Button type="submit" loading={isSubmitting} className="min-h-11 w-full sm:w-auto">
            {isSubmitting ? 'Saving...' : 'Save goal'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default GoalForm
