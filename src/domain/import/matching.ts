import type {
  CustomerCandidate,
  CustomerMatch,
} from './types'

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
}

export function normalizePhone(value?: string | null) {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits || null
}

export function normalizeEmail(value?: string | null) {
  const email = (value ?? '').trim().toLocaleLowerCase('en-US')
  return email || null
}

function uniqueIds(candidates: CustomerCandidate[]) {
  return Array.from(new Set(candidates.map((candidate) => candidate.id))).sort()
}

export function matchCustomer(
  input: Pick<CustomerCandidate, 'name' | 'phone' | 'email'>,
  candidates: CustomerCandidate[],
): CustomerMatch {
  const phone = normalizePhone(input.phone)
  const email = normalizeEmail(input.email)
  const phoneMatches = phone
    ? candidates.filter((candidate) => normalizePhone(candidate.phone) === phone)
    : []
  const emailMatches = email
    ? candidates.filter((candidate) => normalizeEmail(candidate.email) === email)
    : []

  if (phoneMatches.length > 1) {
    return {
      type: 'ambiguous',
      reason: 'More than one customer has this phone number.',
      customerIds: uniqueIds(phoneMatches),
    }
  }
  if (emailMatches.length > 1) {
    return {
      type: 'ambiguous',
      reason: 'More than one customer has this email address.',
      customerIds: uniqueIds(emailMatches),
    }
  }

  const phoneMatch = phoneMatches[0]
  const emailMatch = emailMatches[0]
  if (phoneMatch && emailMatch && phoneMatch.id !== emailMatch.id) {
    return {
      type: 'ambiguous',
      reason: 'Phone and email match different customers.',
      customerIds: uniqueIds([phoneMatch, emailMatch]),
    }
  }
  if (phoneMatch) {
    return { type: 'matched', customerId: phoneMatch.id, matchedBy: 'phone' }
  }
  if (emailMatch) {
    return { type: 'matched', customerId: emailMatch.id, matchedBy: 'email' }
  }

  if (phone || email) return { type: 'new' }

  const normalizedName = normalizeName(input.name)
  const nameMatches = candidates.filter(
    (candidate) => normalizeName(candidate.name) === normalizedName,
  )
  if (nameMatches.length > 1) {
    return {
      type: 'ambiguous',
      reason: 'More than one customer has this full name.',
      customerIds: uniqueIds(nameMatches),
    }
  }
  if (nameMatches[0]) {
    return {
      type: 'matched',
      customerId: nameMatches[0].id,
      matchedBy: 'name',
    }
  }

  return { type: 'new' }
}
