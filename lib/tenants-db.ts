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
import type { TenantLeaseStatus, TenantRecord } from '@/lib/types'

const COLLECTION = 'tenants'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

export function mapTenantDoc(id: string, data: Record<string, unknown>): TenantRecord {
  return {
    id,
    nameEn: String(data.nameEn ?? ''),
    nameAr: String(data.nameAr ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    unitNumber: String(data.unitNumber ?? ''),
    leaseStatus: (['active', 'expired', 'pending'].includes(String(data.leaseStatus))
      ? data.leaseStatus
      : 'pending') as TenantLeaseStatus,
    userId: data.userId ? String(data.userId) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export type TenantSnapshotErrorHandler = (error: Error) => void

/**
 * Real-time list of tenant roster documents.
 * Requires Firestore rules that allow the signed-in user to read `tenants`.
 */
export function subscribeTenantRecords(
  onData: (rows: TenantRecord[]) => void,
  onError?: TenantSnapshotErrorHandler,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapTenantDoc(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => {
      onError?.(err as Error)
    },
  )
}

export type CreateTenantInput = Omit<TenantRecord, 'id' | 'createdAt' | 'updatedAt'>

export async function createTenantRecord(input: CreateTenantInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  const ref = await addDoc(collection(db, COLLECTION), {
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    unitNumber: input.unitNumber.trim(),
    leaseStatus: input.leaseStatus,
    ...(input.userId ? { userId: input.userId } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}
