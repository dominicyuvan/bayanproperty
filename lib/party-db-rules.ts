import type { PartyType } from '@/lib/types'

/**
 * App-level invariant (Firestore has no CHECK constraints).
 * Pair with security rules if you enforce the same on the server.
 */
export function assertPartyIdOrCrForType(input: {
  partyType: PartyType
  idNumber?: string | null
  crNumber?: string | null
}): void {
  if (input.partyType === 'individual') {
    if (!String(input.idNumber ?? '').trim()) throw new Error('PARTY_RULE_ID_REQUIRED')
    return
  }
  if (!String(input.crNumber ?? '').trim()) throw new Error('PARTY_RULE_CR_REQUIRED')
}
