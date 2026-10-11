import { describe, expect, it } from 'vitest'
import { addDays, toDateString, weekdayOf } from './dates.ts'

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

  it('adds days across a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('adds days across a year boundary', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
  })

  it('handles leap day in 2028', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('supports negative days', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('returns the weekday for known dates', () => {
    expect(weekdayOf('2026-03-01')).toBe(0)
    expect(weekdayOf('2026-03-06')).toBe(5)
  })
})
