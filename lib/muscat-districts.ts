/**
 * Stored as `city` when governorate is Muscat (stable keys for i18n).
 * @see messages `properties.muscatDistricts`
 */
export const MUSCAT_DISTRICT_KEYS = [
  'al_bousher',
  'al_ghubrah',
  'al_ghubrah_shamaliyah',
  'al_khoudh',
  'qurum',
  'al_athiba',
  'al_mawalih',
  'al_mabilah',
  'al_ansab',
  'madinat_sultan_qaboos',
  'al_amrat',
  'muttrah',
  'ruwi',
  'al_khuwair',
  'al_mouj',
  'al_seeb',
  'ghala',
  'hamriya',
  'wadi_kabir',
  'darsait',
  'muscat',
  'al_sarooj',
  'al_khair',
  'al_anjarah',
] as const

export type MuscatDistrictKey = (typeof MUSCAT_DISTRICT_KEYS)[number]

export const MUSCAT_DISTRICT_SET = new Set<string>(MUSCAT_DISTRICT_KEYS)

export function isMuscatDistrict(value: string): boolean {
  return MUSCAT_DISTRICT_SET.has(value)
}
