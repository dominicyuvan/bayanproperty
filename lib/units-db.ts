import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UNIT_TYPES, type Unit, type UnitStatus, type UnitType, type UnitUsage } from '@/lib/types'

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
    unitCode: data.unitCode != null ? String(data.unitCode) : undefined,
    isActive: data.isActive !== false,
    nameEn: data.nameEn != null ? String(data.nameEn) : undefined,
    nameAr: data.nameAr != null ? String(data.nameAr) : undefined,
    descriptionEn: data.descriptionEn != null ? String(data.descriptionEn) : undefined,
    descriptionAr: data.descriptionAr != null ? String(data.descriptionAr) : undefined,
    usage: (['for_rent', 'for_sale'].includes(String(data.usage ?? ''))
      ? (data.usage as UnitUsage)
      : 'for_rent'),
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
  unitCode?: string
  isActive: boolean
  nameEn?: string
  nameAr?: string
  descriptionEn?: string
  descriptionAr?: string
  usage?: UnitUsage
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
  const payload: Record<string, unknown> = {
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
  }
  if (input.unitCode?.trim()) payload.unitCode = input.unitCode.trim()
  payload.isActive = input.isActive !== false
  if (input.nameEn?.trim()) payload.nameEn = input.nameEn.trim()
  if (input.nameAr?.trim()) payload.nameAr = input.nameAr.trim()
  if (input.descriptionEn?.trim()) payload.descriptionEn = input.descriptionEn.trim()
  if (input.descriptionAr?.trim()) payload.descriptionAr = input.descriptionAr.trim()
  payload.usage = input.usage ?? 'for_rent'
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

export async function updateUnitRecord(
  id: string,
  patch: Partial<Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  const partial: Record<string, unknown> = { updatedAt: serverTimestamp() }
  const keys: (keyof Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>)[] = [
    'propertyId',
    'unitCode',
    'isActive',
    'nameEn',
    'nameAr',
    'descriptionEn',
    'descriptionAr',
    'usage',
    'unitNumber',
    'type',
    'floor',
    'bedrooms',
    'bathrooms',
    'areaSquareMeters',
    'monthlyRent',
    'status',
    'tenantId',
    'ownerId',
    'leaseStartDate',
    'leaseEndDate',
    'images',
    'features',
  ]
  for (const k of keys) {
    if (!(k in patch)) continue
    const v = patch[k]
    if (k === 'leaseStartDate' || k === 'leaseEndDate') {
      const d = v as Date | undefined
      partial[k] = d ? Timestamp.fromDate(d) : null
      continue
    }
    if (v === undefined) continue
    partial[k] = v
  }
  await updateDoc(doc(db, COLLECTION, id), partial as DocumentData)
}

export async function deleteUnitRecord(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  await deleteDoc(doc(db, COLLECTION, id))
}
