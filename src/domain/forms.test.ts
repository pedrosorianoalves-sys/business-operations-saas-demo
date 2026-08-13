import { describe, expect, it } from 'vitest'

import { parsePositiveNumber, requireText } from './forms'

describe('form validation helpers', () => {
  it('normalizes required text and rejects blank values', () => {
    expect(requireText('  Demo Customer  ', 'Name')).toBe('Demo Customer')
    expect(() => requireText('  ', 'Name')).toThrow('Name is required.')
  })

  it('accepts positive numbers and rejects invalid ranges', () => {
    expect(parsePositiveNumber('12.90', 'Price')).toBe(12.9)
    expect(parsePositiveNumber('0', 'Stock', { allowZero: true })).toBe(0)
    expect(() => parsePositiveNumber('-1', 'Stock', { allowZero: true })).toThrow(
      'Stock cannot be negative.',
    )
    expect(() => parsePositiveNumber('0', 'Price')).toThrow(
      'Price must be greater than zero.',
    )
  })
})
