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
import { assertPartyIdOrCrForType } from '@/lib/party-db-rules'
import type {
  ContactSalutation,
  IndividualIdTypeOman,
  LeadSource,
  PartyType,
  TenantLeaseStatus,
  TenantRecord,
} from '@/lib/types'

const COLLECTION = 'tenants'

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

function parsePartyType(value: unknown): PartyType {
  return value === 'company' ? 'company' : 'individual'
}

function parseIdType(value: unknown): IndividualIdTypeOman | undefined {
  const s = String(value ?? '')
  if (s === 'national_id' || s === 'residency' || s === 'passport') return s
  return undefined
}

function parseSalutation(value: unknown): ContactSalutation | undefined {
  const s = String(value ?? '')
  if (['mr', 'mrs', 'ms', 'dr', 'prof', 'eng'].includes(s)) return s as ContactSalutation
  return undefined
}

function parseLeadSource(value: unknown): LeadSource | undefined {
  const s = String(value ?? '')
  if (['referral', 'website', 'direct', 'agent', 'social_media', 'other'].includes(s)) {
    return s as LeadSource
  }
  return undefined
}

export function mapTenantDoc(id: string, data: Record<string, unknown>): TenantRecord {
  return {
    id,
    partyType: parsePartyType(data.partyType),
    nameEn: String(data.nameEn ?? ''),
    nameAr: String(data.nameAr ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    unitNumber: String(data.unitNumber ?? ''),
    leaseStatus: (['active', 'expired', 'pending'].includes(String(data.leaseStatus))
      ? data.leaseStatus
      : 'pending') as TenantLeaseStatus,
    userId: data.userId ? String(data.userId) : undefined,
    nationality: data.nationality != null ? String(data.nationality) : undefined,
    individualIdType: parseIdType(data.individualIdType),
    idNumber: data.idNumber != null ? String(data.idNumber) : undefined,
    idExpiryDate: data.idExpiryDate instanceof Timestamp ? data.idExpiryDate.toDate() : undefined,
    idDocumentUrl: data.idDocumentUrl != null ? String(data.idDocumentUrl) : undefined,
    idDocumentFileName: data.idDocumentFileName != null ? String(data.idDocumentFileName) : undefined,
    idDocumentStoragePath: data.idDocumentStoragePath != null ? String(data.idDocumentStoragePath) : undefined,
    crNumber: data.crNumber != null ? String(data.crNumber) : undefined,
    crExpiryDate: data.crExpiryDate instanceof Timestamp ? data.crExpiryDate.toDate() : undefined,
    contactPersonName: data.contactPersonName != null ? String(data.contactPersonName) : undefined,
    contactPersonPhone: data.contactPersonPhone != null ? String(data.contactPersonPhone) : undefined,
    crCertificateUrl: data.crCertificateUrl != null ? String(data.crCertificateUrl) : undefined,
    crCertificateFileName: data.crCertificateFileName != null ? String(data.crCertificateFileName) : undefined,
    crCertificateStoragePath: data.crCertificateStoragePath != null ? String(data.crCertificateStoragePath) : undefined,
    iban: data.iban != null ? String(data.iban) : undefined,
    salutation: parseSalutation(data.salutation),
    firstName: data.firstName != null ? String(data.firstName) : undefined,
    lastName: data.lastName != null ? String(data.lastName) : undefined,
    mobile: data.mobile != null ? String(data.mobile) : undefined,
    title: data.title != null ? String(data.title) : undefined,
    mailingStreet: data.mailingStreet != null ? String(data.mailingStreet) : undefined,
    mailingCity: data.mailingCity != null ? String(data.mailingCity) : undefined,
    mailingStateProvince:
      data.mailingStateProvince != null ? String(data.mailingStateProvince) : undefined,
    mailingZip: data.mailingZip != null ? String(data.mailingZip) : undefined,
    mailingCountry: data.mailingCountry != null ? String(data.mailingCountry) : undefined,
    birthdate: data.birthdate instanceof Timestamp ? data.birthdate.toDate() : undefined,
    leadSource: parseLeadSource(data.leadSource),
    department: data.department != null ? String(data.department) : undefined,
    description: data.description != null ? String(data.description) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export type TenantSnapshotErrorHandler = (error: Error) => void

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

function tenantWritePayload(input: CreateTenantInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    partyType: input.partyType,
    nameEn: input.nameEn.trim(),
    nameAr: input.nameAr.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    unitNumber: input.unitNumber.trim(),
    leaseStatus: input.leaseStatus,
  }
  if (input.userId) payload.userId = input.userId
  if (input.nationality != null) payload.nationality = input.nationality
  if (input.individualIdType != null) payload.individualIdType = input.individualIdType
  if (input.idNumber != null) payload.idNumber = input.idNumber
  if (input.idExpiryDate) payload.idExpiryDate = Timestamp.fromDate(input.idExpiryDate)
  if (input.idDocumentUrl != null) payload.idDocumentUrl = input.idDocumentUrl
  if (input.idDocumentFileName != null) payload.idDocumentFileName = input.idDocumentFileName
  if (input.idDocumentStoragePath != null) payload.idDocumentStoragePath = input.idDocumentStoragePath
  if (input.crNumber != null) payload.crNumber = input.crNumber
  if (input.crExpiryDate) payload.crExpiryDate = Timestamp.fromDate(input.crExpiryDate)
  if (input.contactPersonName != null) payload.contactPersonName = input.contactPersonName
  if (input.contactPersonPhone != null) payload.contactPersonPhone = input.contactPersonPhone
  if (input.crCertificateUrl != null) payload.crCertificateUrl = input.crCertificateUrl
  if (input.crCertificateFileName != null) payload.crCertificateFileName = input.crCertificateFileName
  if (input.crCertificateStoragePath != null) payload.crCertificateStoragePath = input.crCertificateStoragePath
  if (input.iban != null && input.iban.trim() !== '') payload.iban = input.iban.trim()
  if (input.salutation) payload.salutation = input.salutation
  if (input.firstName?.trim()) payload.firstName = input.firstName.trim()
  if (input.lastName?.trim()) payload.lastName = input.lastName.trim()
  if (input.mobile?.trim()) payload.mobile = input.mobile.trim()
  if (input.title?.trim()) payload.title = input.title.trim()
  if (input.mailingStreet?.trim()) payload.mailingStreet = input.mailingStreet.trim()
  if (input.mailingCity?.trim()) payload.mailingCity = input.mailingCity.trim()
  if (input.mailingStateProvince?.trim()) payload.mailingStateProvince = input.mailingStateProvince.trim()
  if (input.mailingZip?.trim()) payload.mailingZip = input.mailingZip.trim()
  if (input.mailingCountry?.trim()) payload.mailingCountry = input.mailingCountry.trim()
  if (input.birthdate) payload.birthdate = Timestamp.fromDate(input.birthdate)
  if (input.leadSource) payload.leadSource = input.leadSource
  if (input.department?.trim()) payload.department = input.department.trim()
  if (input.description?.trim()) payload.description = input.description.trim()
  return payload
}

export async function createTenantRecord(input: CreateTenantInput): Promise<string> {
  if (!db) throw new Error('Firestore not initialized')
  assertPartyIdOrCrForType(input)
  const ref = await addDoc(collection(db, COLLECTION), {
    ...tenantWritePayload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function patchTenantRecord(
  id: string,
  patch: Partial<Omit<TenantRecord, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  const partial: Record<string, unknown> = {}
  const keys: (keyof Omit<TenantRecord, 'id' | 'createdAt' | 'updatedAt'>)[] = [
    'partyType',
    'nameEn',
    'nameAr',
    'email',
    'phone',
    'unitNumber',
    'leaseStatus',
    'userId',
    'nationality',
    'individualIdType',
    'idNumber',
    'idExpiryDate',
    'idDocumentUrl',
    'idDocumentFileName',
    'idDocumentStoragePath',
    'crNumber',
    'crExpiryDate',
    'contactPersonName',
    'contactPersonPhone',
    'crCertificateUrl',
    'crCertificateFileName',
    'crCertificateStoragePath',
    'iban',
    'salutation',
    'firstName',
    'lastName',
    'mobile',
    'title',
    'mailingStreet',
    'mailingCity',
    'mailingStateProvince',
    'mailingZip',
    'mailingCountry',
    'birthdate',
    'leadSource',
    'department',
    'description',
  ]
  for (const k of keys) {
    if (!(k in patch)) continue
    const v = patch[k]
    if (k === 'idExpiryDate' || k === 'crExpiryDate' || k === 'birthdate') {
      const d = v as Date | undefined
      if (d) partial[k] = Timestamp.fromDate(d)
      else partial[k] = null
      continue
    }
    if (v === undefined) continue
    partial[k] = k === 'email' && typeof v === 'string' ? v.trim().toLowerCase() : v
  }
  partial.updatedAt = serverTimestamp()
  await updateDoc(doc(db, COLLECTION, id), partial as DocumentData)
}

export async function deleteTenantRecord(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  await deleteDoc(doc(db, COLLECTION, id))
}
