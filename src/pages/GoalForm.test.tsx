import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Goal } from '../types.ts'
import type { Repo } from '../data/repo.ts'
import GoalForm from './GoalForm.tsx'

afterEach(() => {
  cleanup()
})

function createRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    getGoals: vi.fn(async () => []),
    getGoal: vi.fn(async () => undefined),
    addGoal: vi.fn(async (goal: Omit<Goal, 'id'>) => ({ ...goal, id: 'new-goal' })),
    getLogs: vi.fn(async () => []),
    addLog: vi.fn(async (log) => ({ ...log, id: 'new-log' })),
    ...overrides,
  }
}

function renderForm(repo: Repo, now = (): Date => new Date(2026, 0, 5, 12, 0)) {
  return render(
    <MemoryRouter initialEntries={['/goals/new']}>
      <GoalForm repo={repo} now={now} />
    </MemoryRouter>,
  )
}

describe('GoalForm', () => {
  it('has labels for all fields', () => {
    renderForm(createRepo())

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Skill')).toBeInTheDocument()
    expect(screen.getByLabelText('Habit')).toBeInTheDocument()
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument()
    expect(screen.getByLabelText('End goal')).toBeInTheDocument()
    expect(screen.getByLabelText('Minimum version')).toBeInTheDocument()
  })

  it('shows an error for an empty title without adding a goal', async () => {
    const repo = createRepo()
    renderForm(repo)

    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))

    expect(await screen.findByText('Title must be at least 3 characters.')).toBeInTheDocument()
    expect(repo.addGoal).not.toHaveBeenCalled()
  })

  it.each([
    ['two characters', 'ab'],
    ['51 characters', 'a'.repeat(51)],
  ])('rejects a title with %s', async (_, title) => {
    const repo = createRepo()
    renderForm(repo)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: title } })
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))

    expect(await screen.findByText(/Title must be/)).toBeInTheDocument()
    expect(repo.addGoal).not.toHaveBeenCalled()
  })

  it('submits the exact payload with a local created date', async () => {
    const repo = createRepo()
    renderForm(repo, () => new Date(2026, 8, 7, 23, 30))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Learn TypeScript  ' } })
    fireEvent.change(screen.getByLabelText('End goal'), { target: { value: 'Build an app' } })
    fireEvent.change(screen.getByLabelText('Minimum version'), { target: { value: 'TS 5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))

    await waitFor(() => expect(repo.addGoal).toHaveBeenCalledOnce())
    expect(repo.addGoal).toHaveBeenCalledWith({
      title: 'Learn TypeScript',
      kind: 'skill',
      frequency: 'daily',
      endGoal: 'Build an app',
      minimumVersion: 'TS 5',
      createdAt: '2026-09-07',
    })
  })

  it('passes undefined for empty optional fields', async () => {
    const repo = createRepo()
    renderForm(repo)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Learn TypeScript' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))

    await waitFor(() => expect(repo.addGoal).toHaveBeenCalledOnce())
    expect(repo.addGoal).toHaveBeenCalledWith(expect.objectContaining({
      endGoal: undefined,
      minimumVersion: undefined,
    }))
  })

  it('shows a save error and keeps typed values when adding fails', async () => {
    const repo = createRepo({
      addGoal: vi.fn(async () => {
        throw new Error('save failed')
      }),
    })
    renderForm(repo)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Learn TypeScript' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save goal.')
    expect(screen.getByLabelText('Title')).toHaveValue('Learn TypeScript')
  })

  it('links field errors to their inputs', async () => {
    const repo = createRepo()
    renderForm(repo)
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))

    const title = screen.getByLabelText('Title')
    const error = await screen.findByText('Title must be at least 3 characters.')
    expect(title).toHaveAttribute('aria-describedby', error.id)
    expect(title).toHaveAttribute('aria-invalid', 'true')
  })
})
