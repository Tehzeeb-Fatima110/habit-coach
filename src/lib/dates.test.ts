import { describe, expect, it } from 'vitest'
import { toDateString } from './dates.ts'

describe('toDateString', () => {
  it('formats a normal date', () => {
    expect(toDateString(new Date(2026, 9, 11, 12, 0))).toBe('2026-10-11')
  })

  it('pads single-digit months and days', () => {
    expect(toDateString(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05')
  })

  it('formats a year boundary', () => {
    expect(toDateString(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31')
  })

  it('keeps the local calendar day at 23:30', () => {
    expect(toDateString(new Date(2026, 6, 4, 23, 30))).toBe('2026-07-04')
  })
})
