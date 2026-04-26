import { addDoc, collection, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  OMAN_GOVERNORATES,
  PROPERTY_TYPES,
  type PropertyContractType,
  type PropertyStatus,
  type OmanGovernorate,
  type Property,
  type PropertyType,
  type PropertyUsage,
} from '@/lib/types'

const COLLECTION = 'properties'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

function parsePropertyType(value: unknown): PropertyType {
  const s = String(value ?? '')
  return (PROPERTY_TYPES as readonly string[]).includes(s)
    ? (s as PropertyType)
    : 'residential_building'
}

function parseGovernorate(value: unknown): OmanGovernorate {
  const s = String(value ?? '')
  return (OMAN_GOVERNORATES as readonly string[]).includes(s)
    ? (s as OmanGovernorate)
    : 'Muscat'
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((x) => String(x).trim()).filter(Boolean)
}

export function mapPropertyDoc(id: string, data: Record<string, unknown>): Property {
  const totalUnits = Math.max(0, Number(data.totalUnits) || 0)
  const occupied = Math.max(0, Number(data.occupiedUnits) || 0)
  return {
    id,
    code: data.code != null && String(data.code).trim() !== '' ? String(data.code) : undefined,
    plotNumber:
      data.plotNumber != null && String(data.plotNumber).trim() !== ''
        ? String(data.plotNumber)
        : undefined,
    nameEn: String(data.nameEn ?? ''),
    nameAr: String(data.nameAr ?? ''),
    type: parsePropertyType(data.type),
    governorate: parseGovernorate(data.governorate),
    city: String(data.city ?? ''),
    addressEn: String(data.addressEn ?? ''),
    addressAr: String(data.addressAr ?? ''),
    totalUnits,
    occupiedUnits: occupied > totalUnits ? totalUnits : occupied,
    managerId: data.managerId ? String(data.managerId) : undefined,
    associationId: data.associationId ? String(data.associationId) : undefined,
    status: (['new', 'under_construction', 'complete'].includes(String(data.status ?? ''))
      ? data.status
      : 'new') as PropertyStatus,
    usage: (['residential', 'commercial', 'mixed'].includes(String(data.usage ?? ''))
      ? (data.usage as PropertyUsage)
      : undefined),
    contractType: (['for_rent', 'for_sale', 'for_rent_and_sale'].includes(String(data.contractType ?? ''))
      ? (data.contractType as PropertyContractType)
      : undefined),
    completionPercent: data.completionPercent != null ? Number(data.completionPercent) : undefined,
    startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : undefined,
    handoverDate: data.handoverDate instanceof Timestamp ? data.handoverDate.toDate() : undefined,
    landAreaSqm: data.landAreaSqm != null ? Number(data.landAreaSqm) : undefined,
    builtUpAreaSqm: data.builtUpAreaSqm != null ? Number(data.builtUpAreaSqm) : undefined,
    nationalAddress: data.nationalAddress != null ? String(data.nationalAddress) : undefined,
    images: stringArray(data.images),
    amenities: stringArray(data.amenities),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export type PropertySnapshotErrorHandler = (error: Error) => void

function sortPropertiesNewestFirst(rows: Property[]): Property[] {
  return [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Listens to all property documents (no server `orderBy`).
 * Avoids excluding rows while `createdAt` is still a pending server timestamp
 * and avoids composite-index requirements for simple setups.
 */
export function subscribeProperties(
  onData: (rows: Property[]) => void,
  onError?: PropertySnapshotErrorHandler,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const col = collection(db, COLLECTION)
  return onSnapshot(
    col,
    (snap) => {
      const rows = snap.docs.map((d) => mapPropertyDoc(d.id, d.data() as Record<string, unknown>))
      onData(sortPropertiesNewestFirst(rows))
    },
    (err) => onError?.(err as Error),
  )
}

export type CreatePropertyInput = Omit<Property, 'id' | 'occupiedUnits' | 'createdAt' | 'updatedAt'>

export async function createPropertyRecord(input: CreatePropertyInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  const plot = input.plotNumber?.trim()
  const total = Number(input.totalUnits)
  const totalUnits = Math.max(1, Number.isFinite(total) ? Math.floor(total) : 1)
  const codeTrim = input.code?.trim()
  const payload: Record<string, unknown> = {
    ...(codeTrim ? { code: codeTrim } : {}),
    ...(plot ? { plotNumber: plot } : {}),
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    type: input.type,
    governorate: input.governorate,
    city: input.city.trim(),
    addressEn: input.addressEn.trim(),
    addressAr: input.addressAr.trim(),
    totalUnits,
    occupiedUnits: 0,
    ...(input.managerId ? { managerId: input.managerId } : {}),
    images: [],
    amenities: input.amenities,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (input.status) payload.status = input.status
  if (input.usage) payload.usage = input.usage
  if (input.contractType) payload.contractType = input.contractType
  if (input.completionPercent != null) payload.completionPercent = input.completionPercent
  if (input.startDate) payload.startDate = Timestamp.fromDate(input.startDate)
  if (input.handoverDate) payload.handoverDate = Timestamp.fromDate(input.handoverDate)
  if (input.landAreaSqm != null) payload.landAreaSqm = input.landAreaSqm
  if (input.builtUpAreaSqm != null) payload.builtUpAreaSqm = input.builtUpAreaSqm
  if (input.nationalAddress) payload.nationalAddress = input.nationalAddress.trim()
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}
