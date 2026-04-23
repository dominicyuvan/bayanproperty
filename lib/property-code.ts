import type { OmanGovernorate } from '@/lib/types'

const GOVERNORATE_PREFIX: Record<string, string> = {
  Muscat: 'MSC',
  Dhofar: 'DHF',
  Musandam: 'MSA',
  'Al Buraimi': 'BRM',
  'Ad Dakhiliyah': 'DAK',
  'Al Batinah North': 'BTN',
  'Al Batinah South': 'BTS',
  'Ash Sharqiyah North': 'SQN',
  'Ash Sharqiyah South': 'SQS',
  'Ad Dhahirah': 'DHR',
  'Al Wusta': 'WST',
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomSuffix(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let s = ''
  for (let i = 0; i < length; i++) s += CODE_CHARS[bytes[i]! % CODE_CHARS.length]!
  return s
}

/**
 * Human-readable, unique property reference: BAY-{region}-{YYYY}-{RANDOM}
 * Region prefix helps operations teams; random suffix keeps collision risk negligible without a central counter.
 */
export function generatePropertyCode(governorate?: OmanGovernorate | string | null): string {
  const region = governorate
    ? GOVERNORATE_PREFIX[String(governorate)] ?? 'OMN'
    : 'OMN'
  const year = new Date().getFullYear()
  const suffix = randomSuffix(5)
  return `BAY-${region}-${year}-${suffix}`
}
