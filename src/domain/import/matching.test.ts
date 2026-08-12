import { describe, expect, it } from 'vitest'

import { matchCustomer } from './matching'

const candidates = [
  {
    id: 'customer-a',
    name: 'Emma Collins',
    phone: '+1 (555) 010-1001',
    email: 'emma.collins@example.com',
  },
  {
    id: 'customer-b',
    name: 'Daniel Brooks',
    phone: '+1 (555) 010-1002',
    email: 'daniel.brooks@example.com',
  },
]

describe('matchCustomer', () => {
  it('uses normalized phone before email and name', () => {
    expect(
      matchCustomer(
        {
          name: 'Different Name',
          phone: '1-555-010-1001',
          email: 'different@example.com',
        },
        candidates,
      ),
    ).toEqual({ type: 'matched', customerId: 'customer-a', matchedBy: 'phone' })
  })

  it('uses normalized email when phone is absent', () => {
    expect(
      matchCustomer(
        { name: 'Different Name', email: '  DANIEL.BROOKS@EXAMPLE.COM ' },
        candidates,
      ),
    ).toEqual({ type: 'matched', customerId: 'customer-b', matchedBy: 'email' })
  })

  it('uses the full normalized name only when both contacts are absent', () => {
    expect(
      matchCustomer(
        { name: '  Emma   Collins  ' },
        [{ id: 'customer-a', name: 'emma collins' }],
      ),
    ).toEqual({ type: 'matched', customerId: 'customer-a', matchedBy: 'name' })
  })

  it('never falls back to name when a supplied phone does not match', () => {
    expect(
      matchCustomer(
        { name: 'Emma Collins', phone: '+1 555 010 9999' },
        candidates,
      ),
    ).toEqual({ type: 'new' })
  })

  it('rejects conflicting phone and email matches', () => {
    expect(
      matchCustomer(
        {
          name: 'Conflicting Contact',
          phone: '+1 555 010 1001',
          email: 'daniel.brooks@example.com',
        },
        candidates,
      ),
    ).toEqual({
      type: 'ambiguous',
      reason: 'Phone and email match different customers.',
      customerIds: ['customer-a', 'customer-b'],
    })
  })

  it('rejects duplicate name-only candidates', () => {
    expect(
      matchCustomer(
        { name: 'Alex Morgan' },
        [
          { id: 'customer-a', name: 'Alex Morgan' },
          { id: 'customer-b', name: 'alex  morgan' },
        ],
      ),
    ).toEqual({
      type: 'ambiguous',
      reason: 'More than one customer has this full name.',
      customerIds: ['customer-a', 'customer-b'],
    })
  })
})
