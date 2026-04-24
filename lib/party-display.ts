import type { OwnerRecord, PartyType, TenantRecord } from '@/lib/types'

export function partyTypeLabelKey(partyType: PartyType): 'individual' | 'company' {
  return partyType === 'company' ? 'company' : 'individual'
}

export function getPrimaryExpiryForParty(
  row: Pick<OwnerRecord | TenantRecord, 'partyType' | 'idExpiryDate' | 'crExpiryDate'>,
): Date | undefined {
  if (row.partyType === 'company') return row.crExpiryDate
  return row.idExpiryDate
}

/** Subtitle for tenant/owner dropdowns: ID number or CR number. */
export function getPartyIdSubtitle(row: OwnerRecord | TenantRecord): string {
  if (row.partyType === 'company') {
    return row.crNumber?.trim() ? `CR ${row.crNumber}` : '—'
  }
  if (row.idNumber?.trim()) {
    const t = row.individualIdType ?? 'national_id'
    if (t === 'passport') return `Passport ${row.idNumber}`
    if (t === 'residency') return `Residency ${row.idNumber}`
    return `ID ${row.idNumber}`
  }
  return '—'
}
