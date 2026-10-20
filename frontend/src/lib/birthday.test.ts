import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isBirthdayToday } from './birthday'

describe('birthday helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 20, 15, 30)) // Oct 20, 2026, local time
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('recognizes a birthday on today’s month and day, regardless of year', () => {
    expect(isBirthdayToday('2003-10-20')).toBe(true)
    expect(isBirthdayToday('2003-10-21')).toBe(false)
  })

  it('treats missing or malformed values as not a birthday', () => {
    expect(isBirthdayToday(null)).toBe(false)
    expect(isBirthdayToday(undefined)).toBe(false)
    expect(isBirthdayToday('10/20/2003')).toBe(false)
  })
})
