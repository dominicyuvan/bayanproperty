import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { LeaseContract, LeaseContractStatus, LeasePaymentMethod } from '@/lib/types'

const COLLECTION = 'leases'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

function parseStatus(value: unknown): LeaseContractStatus {
  const s = String(value ?? '')
  if (['draft', 'active', 'expired', 'terminated'].includes(s)) return s as LeaseContractStatus
  return 'draft'
}

function parsePaymentMethod(value: unknown): LeasePaymentMethod | undefined {
  const s = String(value ?? '')
  if (['bank_transfer', 'cash', 'cheque', 'pdc'].includes(s)) return s as LeasePaymentMethod
  return undefined
}

/** Auto-generate a contract number: LC-2026-K4F2X */
function generateContractNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7)
  return `LC-${year}-${rand}`
}

export function mapLeaseDoc(id: string, data: Record<string, unknown>): LeaseContract {
  return {
    id,
    contractNumber: String(data.contractNumber ?? ''),
    tenantId: String(data.tenantId ?? ''),
    propertyId: String(data.propertyId ?? ''),
    unitId: String(data.unitId ?? ''),
    status: parseStatus(data.status),
    paymentMethod: parsePaymentMethod(data.paymentMethod),
    contractType: 'rental',
    contractStartDate: toDate(data.contractStartDate),
    contractEndDate: data.contractEndDate instanceof Timestamp ? data.contractEndDate.toDate() : undefined,
    contractTermMonths: data.contractTermMonths != null ? Number(data.contractTermMonths) : undefined,
    specialTerms: data.specialTerms != null ? String(data.specialTerms) : undefined,
    description: data.description != null ? String(data.description) : undefined,
    customerSignedBy: data.customerSignedBy != null ? String(data.customerSignedBy) : undefined,
    customerSignedDate:
      data.customerSignedDate instanceof Timestamp ? data.customerSignedDate.toDate() : undefined,
    companySignedBy: data.companySignedBy != null ? String(data.companySignedBy) : undefined,
    companySignedDate:
      data.companySignedDate instanceof Timestamp ? data.companySignedDate.toDate() : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export type LeaseSnapshotErrorHandler = (error: Error) => void

export function subscribeLeases(
  onData: (rows: LeaseContract[]) => void,
  onError?: LeaseSnapshotErrorHandler,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapLeaseDoc(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => onError?.(err as Error),
  )
}

export type CreateLeaseInput = Omit<LeaseContract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>

export async function createLeaseRecord(input: CreateLeaseInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  const payload: Record<string, unknown> = {
    contractNumber: generateContractNumber(),
    tenantId: input.tenantId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    status: input.status,
    contractType: 'rental',
    contractStartDate: Timestamp.fromDate(input.contractStartDate),
  }
  if (input.paymentMethod) payload.paymentMethod = input.paymentMethod
  if (input.contractEndDate) payload.contractEndDate = Timestamp.fromDate(input.contractEndDate)
  if (input.contractTermMonths != null) payload.contractTermMonths = input.contractTermMonths
  if (input.specialTerms?.trim()) payload.specialTerms = input.specialTerms.trim()
  if (input.description?.trim()) payload.description = input.description.trim()
  if (input.customerSignedBy?.trim()) payload.customerSignedBy = input.customerSignedBy.trim()
  if (input.customerSignedDate) payload.customerSignedDate = Timestamp.fromDate(input.customerSignedDate)
  if (input.companySignedBy?.trim()) payload.companySignedBy = input.companySignedBy.trim()
  if (input.companySignedDate) payload.companySignedDate = Timestamp.fromDate(input.companySignedDate)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

export async function updateLeaseRecord(
  id: string,
  patch: Partial<Omit<LeaseContract, 'id' | 'contractNumber' | 'createdAt'>>,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  const partial: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (patch.status) partial.status = patch.status
  if (patch.paymentMethod) partial.paymentMethod = patch.paymentMethod
  if (patch.contractStartDate) partial.contractStartDate = Timestamp.fromDate(patch.contractStartDate)
  if (patch.contractEndDate) partial.contractEndDate = Timestamp.fromDate(patch.contractEndDate)
  if (patch.contractTermMonths != null) partial.contractTermMonths = patch.contractTermMonths
  if (patch.specialTerms !== undefined) partial.specialTerms = patch.specialTerms
  if (patch.description !== undefined) partial.description = patch.description
  if (patch.customerSignedBy !== undefined) partial.customerSignedBy = patch.customerSignedBy
  if (patch.customerSignedDate) partial.customerSignedDate = Timestamp.fromDate(patch.customerSignedDate)
  if (patch.companySignedBy !== undefined) partial.companySignedBy = patch.companySignedBy
  if (patch.companySignedDate) partial.companySignedDate = Timestamp.fromDate(patch.companySignedDate)
  await updateDoc(doc(db, COLLECTION, id), partial as DocumentData)
}

export async function deleteLeaseRecord(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  await deleteDoc(doc(db, COLLECTION, id))
}
