export type ExpiryUrgency = 'none' | 'ok' | 'warning' | 'expired'

const MS_DAY = 86_400_000
const WARNING_DAYS = 30

/** ID / CR expiry relative to today (local). */
export function getExpiryUrgency(expiry: Date | undefined | null): ExpiryUrgency {
  if (!expiry || Number.isNaN(expiry.getTime())) return 'none'
  const end = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  if (end < start) return 'expired'
  const days = (end - start) / MS_DAY
  if (days <= WARNING_DAYS) return 'warning'
  return 'ok'
}
