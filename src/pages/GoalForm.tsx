import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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

function GoalForm({ repo = defaultRepo, now = () => new Date() }: GoalFormProps) {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const {
    register,
    handleSubmit,
    setFocus,
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

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Goal</h1>
          <p className="text-sm leading-6 text-gray-600">
            Set a clear goal and define how you want to make progress.
          </p>
        </header>
        {submitError && (
          <p role="alert" className="rounded-lg border border-danger-600 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {submitError}
          </p>
        )}

        <fieldset className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-800">Title</label>
          <input
            id="title"
            type="text"
            className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
              errors.title ? 'border-danger-600' : 'border-gray-300'
            }`}
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : undefined}
            {...register('title')}
          />
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
                className="peer absolute left-3 top-1/2 z-10 h-4 w-4 min-h-0 -translate-y-1/2 accent-accent-600"
                aria-invalid={errors.kind ? 'true' : 'false'}
                aria-describedby={errors.kind ? 'kind-error' : undefined}
                {...register('kind')}
              />
              <label htmlFor="kind-skill" className="flex min-h-14 cursor-pointer items-center rounded-lg border border-gray-300 px-3 pl-10 text-sm font-medium text-gray-700 transition-colors peer-checked:border-accent-600 peer-checked:bg-accent-50 peer-checked:text-accent-800 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600">
                Skill
              </label>
            </span>
            <span className="relative">
              <input
                id="kind-habit"
                type="radio"
                value="habit"
                className="peer absolute left-3 top-1/2 z-10 h-4 w-4 min-h-0 -translate-y-1/2 accent-accent-600"
                aria-invalid={errors.kind ? 'true' : 'false'}
                aria-describedby={errors.kind ? 'kind-error' : undefined}
                {...register('kind')}
              />
              <label htmlFor="kind-habit" className="flex min-h-14 cursor-pointer items-center rounded-lg border border-gray-300 px-3 pl-10 text-sm font-medium text-gray-700 transition-colors peer-checked:border-accent-600 peer-checked:bg-accent-50 peer-checked:text-accent-800 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600">
                Habit
              </label>
            </span>
          </span>
          {errors.kind && <p id="kind-error" className="text-sm text-danger-700">{errors.kind.message}</p>}
        </fieldset>

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

        <fieldset className="space-y-2">
          <label htmlFor="endGoal" className="block text-sm font-semibold text-gray-800">End goal</label>
          <input
            id="endGoal"
            type="text"
            className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
              errors.endGoal ? 'border-danger-600' : 'border-gray-300'
            }`}
            aria-invalid={errors.endGoal ? 'true' : 'false'}
            aria-describedby={errors.endGoal ? 'endGoal-error' : undefined}
            {...register('endGoal')}
          />
          {errors.endGoal && <p id="endGoal-error" className="text-sm text-danger-700">{errors.endGoal.message}</p>}
        </fieldset>

        <fieldset className="space-y-2">
          <label htmlFor="minimumVersion" className="block text-sm font-semibold text-gray-800">Minimum version</label>
          <input
            id="minimumVersion"
            type="text"
            className={`w-full rounded-control border bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
              errors.minimumVersion ? 'border-danger-600' : 'border-gray-300'
            }`}
            aria-invalid={errors.minimumVersion ? 'true' : 'false'}
            aria-describedby={errors.minimumVersion ? 'minimumVersion-error' : undefined}
            {...register('minimumVersion')}
          />
          {errors.minimumVersion && <p id="minimumVersion-error" className="text-sm text-danger-700">{errors.minimumVersion.message}</p>}
        </fieldset>

        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : 'Save goal'}
        </Button>
      </form>
    </Card>
  )
}

export default GoalForm
