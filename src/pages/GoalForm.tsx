import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <h1>New Goal</h1>
      {submitError && <p role="alert">{submitError}</p>}

      <label htmlFor="title">Title</label>
      <input
        id="title"
        type="text"
        aria-invalid={errors.title ? 'true' : 'false'}
        aria-describedby={errors.title ? 'title-error' : undefined}
        {...register('title')}
      />
      {errors.title && <p id="title-error">{errors.title.message}</p>}

      <fieldset>
        <legend>Kind</legend>
        <label htmlFor="kind-skill">Skill</label>
        <input
          id="kind-skill"
          type="radio"
          value="skill"
          aria-invalid={errors.kind ? 'true' : 'false'}
          aria-describedby={errors.kind ? 'kind-error' : undefined}
          {...register('kind')}
        />
        <label htmlFor="kind-habit">Habit</label>
        <input
          id="kind-habit"
          type="radio"
          value="habit"
          aria-invalid={errors.kind ? 'true' : 'false'}
          aria-describedby={errors.kind ? 'kind-error' : undefined}
          {...register('kind')}
        />
        {errors.kind && <p id="kind-error">{errors.kind.message}</p>}
      </fieldset>

      <label htmlFor="frequency">Frequency</label>
      <select
        id="frequency"
        aria-invalid={errors.frequency ? 'true' : 'false'}
        aria-describedby={errors.frequency ? 'frequency-error' : undefined}
        {...register('frequency')}
      >
        <option value="daily">Daily</option>
        <option value="weekdays">Weekdays</option>
        <option value="custom">Custom</option>
      </select>
      {errors.frequency && <p id="frequency-error">{errors.frequency.message}</p>}

      <label htmlFor="endGoal">End goal</label>
      <input
        id="endGoal"
        type="text"
        aria-invalid={errors.endGoal ? 'true' : 'false'}
        aria-describedby={errors.endGoal ? 'endGoal-error' : undefined}
        {...register('endGoal')}
      />
      {errors.endGoal && <p id="endGoal-error">{errors.endGoal.message}</p>}

      <label htmlFor="minimumVersion">Minimum version</label>
      <input
        id="minimumVersion"
        type="text"
        aria-invalid={errors.minimumVersion ? 'true' : 'false'}
        aria-describedby={errors.minimumVersion ? 'minimumVersion-error' : undefined}
        {...register('minimumVersion')}
      />
      {errors.minimumVersion && <p id="minimumVersion-error">{errors.minimumVersion.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save goal'}
      </button>
    </form>
  )
}

export default GoalForm
