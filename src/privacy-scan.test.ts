import { describe, expect, it } from 'vitest'

import { scanText } from '../scripts/privacy-scan-core.mjs'

describe('privacy scanner', () => {
  it('flags private brand, secrets, production URLs, personal email, and non-reserved phone', () => {
    const findings = scanText('fixture.txt', [
      ['Delícias', 'da', ['Mar', 'li'].join('')].join(' '),
      ['SUPABASE_SERVICE_ROLE', 'KEY=abc123'].join('_'),
      ['https://real-company', 'supabase', 'co'].join('.'),
      ['person', 'gmail.com'].join('@'),
      ['+55 11', '98765', '4321'].join(' '),
    ].join('\n'))

    expect(findings.map((finding: { rule: string }) => finding.rule)).toEqual(
      expect.arrayContaining(['original-brand', 'credential', 'supabase-url', 'non-example-email', 'non-reserved-phone']),
    )
  })

  it('allows fictional contacts and empty environment templates', () => {
    expect(scanText('seed.sql', 'emma.collins@example.com +1 555 010 1001')).toEqual([])
    expect(scanText('.env.example', 'NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=')).toEqual([])
  })
})
