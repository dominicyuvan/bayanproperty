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
import type { OwnerRecord } from '@/lib/types'

const COLLECTION = 'owners'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

export function mapOwnerDoc(id: string, data: Record<string, unknown>): OwnerRecord {
  return {
    id,
    nameEn: String(data.nameEn ?? ''),
    nameAr: String(data.nameAr ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    propertyCount: Math.max(0, Math.floor(Number(data.propertyCount) || 0)),
    unitCount: Math.max(0, Math.floor(Number(data.unitCount) || 0)),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export type OwnerSnapshotErrorHandler = (error: Error) => void

export function subscribeOwnerRecords(
  onData: (rows: OwnerRecord[]) => void,
  onError?: OwnerSnapshotErrorHandler,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapOwnerDoc(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => onError?.(err as Error),
  )
}

export type CreateOwnerInput = Omit<OwnerRecord, 'id' | 'createdAt' | 'updatedAt'>

export async function createOwnerRecord(input: CreateOwnerInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  const ref = await addDoc(collection(db, COLLECTION), {
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    propertyCount: Math.max(0, Math.floor(Number(input.propertyCount) || 0)),
    unitCount: Math.max(0, Math.floor(Number(input.unitCount) || 0)),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}
