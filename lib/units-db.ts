import { addDoc, collection, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UNIT_TYPES, type Unit, type UnitStatus, type UnitType } from '@/lib/types'

const COLLECTION = 'units'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

function parseUnitType(value: unknown): UnitType {
  const s = String(value ?? '')
  return (UNIT_TYPES as readonly string[]).includes(s) ? (s as UnitType) : 'apartment'
}

function parseStatus(value: unknown): UnitStatus {
  const s = String(value ?? '')
  return (['vacant', 'occupied', 'maintenance', 'reserved'] as const).includes(s as UnitStatus)
    ? (s as UnitStatus)
    : 'vacant'
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((x) => String(x).trim()).filter(Boolean)
}

export function mapUnitDoc(id: string, data: Record<string, unknown>): Unit {
  return {
    id,
    propertyId: String(data.propertyId ?? ''),
    unitNumber: String(data.unitNumber ?? ''),
    type: parseUnitType(data.type),
    floor: Math.max(0, Math.floor(Number(data.floor) || 0)),
    bedrooms: Math.max(0, Math.floor(Number(data.bedrooms) || 0)),
    bathrooms: Math.max(1, Math.floor(Number(data.bathrooms) || 1)),
    areaSquareMeters: Math.max(0, Number(data.areaSquareMeters) || 0),
    monthlyRent: Math.max(0, Number(data.monthlyRent) || 0),
    status: parseStatus(data.status),
    tenantId: data.tenantId ? String(data.tenantId) : undefined,
    ownerId: data.ownerId ? String(data.ownerId) : undefined,
    leaseStartDate: data.leaseStartDate ? toDate(data.leaseStartDate) : undefined,
    leaseEndDate: data.leaseEndDate ? toDate(data.leaseEndDate) : undefined,
    images: stringArray(data.images),
    features: stringArray(data.features),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

function sortUnitsNewestFirst(rows: Unit[]): Unit[] {
  return [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Listens to all unit documents (no server `orderBy`) — same pattern as `subscribeProperties`.
 */
export function subscribeUnits(
  onData: (rows: Unit[]) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      const rows = snap.docs.map((d) => mapUnitDoc(d.id, d.data() as Record<string, unknown>))
      onData(sortUnitsNewestFirst(rows))
    },
    (err) => onError?.(err as Error),
  )
}

export type CreateUnitInput = {
  propertyId: string
  unitNumber: string
  type: UnitType
  floor: number
  bedrooms: number
  bathrooms: number
  areaSquareMeters: number
  monthlyRent: number
  status: UnitStatus
}

export async function createUnitRecord(input: CreateUnitInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  const ref = await addDoc(collection(db, COLLECTION), {
    propertyId: input.propertyId.trim(),
    unitNumber: input.unitNumber.trim(),
    type: input.type,
    floor: input.floor,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSquareMeters: input.areaSquareMeters,
    monthlyRent: input.monthlyRent,
    status: input.status,
    images: [],
    features: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}
