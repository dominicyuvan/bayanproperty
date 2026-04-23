import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  OMAN_GOVERNORATES,
  PROPERTY_TYPES,
  type OmanGovernorate,
  type Property,
  type PropertyType,
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
    images: stringArray(data.images),
    amenities: stringArray(data.amenities),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export type PropertySnapshotErrorHandler = (error: Error) => void

export function subscribeProperties(
  onData: (rows: Property[]) => void,
  onError?: PropertySnapshotErrorHandler,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapPropertyDoc(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => onError?.(err as Error),
  )
}

export type CreatePropertyInput = {
  code: string
  plotNumber?: string
  nameEn: string
  nameAr: string
  type: PropertyType
  governorate: OmanGovernorate
  city: string
  addressEn: string
  addressAr: string
  totalUnits: number
  amenities: string[]
}

export async function createPropertyRecord(input: CreatePropertyInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  const plot = input.plotNumber?.trim()
  const ref = await addDoc(collection(db, COLLECTION), {
    code: input.code.trim(),
    ...(plot ? { plotNumber: plot } : {}),
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    type: input.type,
    governorate: input.governorate,
    city: input.city.trim(),
    addressEn: input.addressEn.trim(),
    addressAr: input.addressAr.trim(),
    totalUnits: Math.max(1, input.totalUnits),
    occupiedUnits: 0,
    images: [],
    amenities: input.amenities,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}
