export function requireText(value: unknown, label: string) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) throw new Error(`${label} is required.`)
  return normalized
}

export function optionalText(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized || null
}

export function parsePositiveNumber(
  value: unknown,
  label: string,
  options: { allowZero?: boolean } = {},
) {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a number.`)
  if (options.allowZero ? parsed < 0 : parsed <= 0) {
    throw new Error(
      options.allowZero
        ? `${label} cannot be negative.`
        : `${label} must be greater than zero.`,
    )
  }
  return parsed
}
