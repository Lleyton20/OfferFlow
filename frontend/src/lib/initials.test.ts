import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('uses the first and last name', () => {
    expect(initials('Lleyton Magama', 'l@example.com')).toBe('LM')
    expect(initials('Ana María de la Cruz', 'a@example.com')).toBe('AC')
  })

  it('uses the first two letters of a single name', () => {
    expect(initials('Cher', 'c@example.com')).toBe('CH')
  })

  it('falls back to the email when there is no name', () => {
    expect(initials(null, 'jordan@example.com')).toBe('JO')
    expect(initials('   ', 'sam@example.com')).toBe('SA')
  })
})
