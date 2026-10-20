import { describe, expect, it } from 'vitest'
import { timeAgo } from './time'

const NOW = new Date('2026-10-20T12:00:00Z')

describe('timeAgo', () => {
  it.each([
    ['2026-10-20T11:59:40Z', 'just now'],
    ['2026-10-20T11:55:00Z', '5m ago'],
    ['2026-10-20T09:00:00Z', '3h ago'],
    ['2026-10-18T12:00:00Z', '2d ago'],
  ])('formats %s as %s', (iso, expected) => {
    expect(timeAgo(iso, NOW)).toBe(expected)
  })

  it('falls back to a date beyond a month', () => {
    expect(timeAgo('2026-08-01T12:00:00Z', NOW)).toMatch(/Aug/)
  })
})
