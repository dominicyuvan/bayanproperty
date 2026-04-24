import type { IndividualIdTypeOman, UserUploadCategory } from '@/lib/types'

export function individualIdTypeToUploadCategory(t: IndividualIdTypeOman): UserUploadCategory {
  if (t === 'national_id') return 'national_id'
  if (t === 'residency') return 'residence_visa'
  return 'passport'
}
