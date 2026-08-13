const PRIVATE_SURNAME = ['mar', 'li'].join('')
const ORIGINAL_BRAND = new RegExp(`(?:del[ií]cias\\s+da\\s+${PRIVATE_SURNAME}|\\b${PRIVATE_SURNAME}\\b)`, 'giu')
const CREDENTIAL = /\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|API_KEY)\s*[=:]\s*['"]?([^\s'";]+)/giu
const SUPABASE_URL = /https:\/\/([a-z0-9-]+)\.supabase\.co\b/giu
const EMAIL = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/giu
const PHONE = /(?:\+\d[\d ()-]{8,}\d|\b55\d{10,11}\b|\b1\d{10}\b)/gu

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length
}

export function scanText(file, text) {
  const findings = []
  const add = (rule, match) => findings.push({ file, line: lineNumber(text, match.index), rule, sample: match[0].slice(0, 100) })

  for (const match of text.matchAll(ORIGINAL_BRAND)) add('original-brand', match)
  for (const match of text.matchAll(CREDENTIAL)) {
    const value = match[1]
    if (value && !/^(?:your-|example|placeholder|changeme)/i.test(value)) add('credential', match)
  }
  for (const match of text.matchAll(SUPABASE_URL)) {
    if (match[1] !== 'demo-project') add('supabase-url', match)
  }
  for (const match of text.matchAll(EMAIL)) {
    if (match[1].toLowerCase() !== 'example.com') add('non-example-email', match)
  }
  for (const match of text.matchAll(PHONE)) {
    const digits = match[0].replace(/\D/g, '')
    const fictional = /^1?555010\d{4}$/.test(digits)
    if (!fictional) add('non-reserved-phone', match)
  }
  return findings
}
