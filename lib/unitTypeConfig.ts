import type { UnitType } from '@/lib/types'

/**
 * Central place to classify unit types for form rules.
 * Add new `UnitType` values in `@/lib/types` `UNIT_TYPES`, then assign them here.
 */
/** Commercial: Shop, Office (plus any extras like warehouse below). */
export const COMMERCIAL_UNIT_TYPES = ['shop', 'office'] as const
/** Residential: Apartment, Villa (penthouse uses the same bedroom rules; studio is separate). */
export const RESIDENTIAL_BEDROOM_UNIT_TYPES = ['apartment', 'villa', 'penthouse'] as const
export const STUDIO_UNIT_TYPES = ['studio'] as const

/** Other non-residential / non-studio types that follow commercial field rules. */
const COMMERCIAL_LIKE_EXTRAS = ['warehouse'] as const satisfies readonly UnitType[]

const commercialSet = new Set<string>([...COMMERCIAL_UNIT_TYPES, ...COMMERCIAL_LIKE_EXTRAS])
const residentialBedroomSet = new Set<string>(RESIDENTIAL_BEDROOM_UNIT_TYPES)
const studioSet = new Set<string>(STUDIO_UNIT_TYPES)

export function isCommercialUnitType(type: UnitType): boolean {
  return commercialSet.has(type)
}

export function isStudioUnitType(type: UnitType): boolean {
  return studioSet.has(type)
}

/** Residential types that show the bedrooms field (min 1). Excludes studio. */
export function isResidentialBedroomUnitType(type: UnitType): boolean {
  return residentialBedroomSet.has(type)
}

/** Commercial (no bedroom field) or studio (bedrooms fixed to 0, field hidden). */
export function isBedroomFieldHidden(type: UnitType): boolean {
  return isCommercialUnitType(type) || isStudioUnitType(type)
}

/** When true, render the bedrooms field. */
export function shouldShowBedroomsField(type: UnitType): boolean {
  return isResidentialBedroomUnitType(type)
}

export function getDefaultBedroomsForType(type: UnitType): number {
  if (isBedroomFieldHidden(type)) return 0
  return 1
}

export function getDefaultBathroomsForType(type: UnitType): number {
  if (isCommercialUnitType(type)) return 0
  return 1
}

export function getBathroomsInputMin(type: UnitType): number {
  if (isCommercialUnitType(type)) return 0
  return 1
}

export function getBedroomsInputMin(_type: UnitType): number {
  return 1
}
