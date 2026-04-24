import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { UserUploadCategory, UserUploadRecord } from '@/lib/types'
import { assertKycFile, mapUploadDoc } from '@/lib/user-uploads'

export const ROSTER_PARTY_KYC_MAX_BYTES = 5 * 1024 * 1024
const ROSTER_PARTY_KYC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

export function assertRosterPartyKyc5mb(file: File): void {
  if (file.size > ROSTER_PARTY_KYC_MAX_BYTES) {
    throw new Error('PARTY_KYC_TOO_LARGE')
  }
  if (!ROSTER_PARTY_KYC_TYPES.includes(file.type as (typeof ROSTER_PARTY_KYC_TYPES)[number])) {
    throw new Error('PARTY_KYC_BAD_TYPE')
  }
}

export type RosterEntity = 'tenants' | 'owners'

function getStorageOrThrow(): FirebaseStorage {
  if (!storage) throw new Error('Firebase Storage not initialized')
  return storage
}

function getDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized')
  return db
}

function safeFileSuffix(originalName: string): string {
  const base = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
  return base || 'file'
}

export function subscribeRosterUploads(
  entity: RosterEntity,
  entityId: string,
  onData: (rows: UserUploadRecord[]) => void,
  onError?: (e: Error) => void,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, entity, entityId, 'uploads'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapUploadDoc(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => onError?.(err as Error),
  )
}

export async function uploadRosterDocument(
  entity: RosterEntity,
  entityId: string,
  category: UserUploadCategory,
  file: File,
): Promise<void> {
  const bucket = getStorageOrThrow()
  const fs = getDb()
  assertKycFile(file)
  const path = `${entity}/${entityId}/documents/${category}_${Date.now()}_${safeFileSuffix(file.name)}`
  const storageRef = ref(bucket, path)
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { category, entity, entityId },
  })
  const url = await getDownloadURL(storageRef)

  await addDoc(collection(fs, entity, entityId, 'uploads'), {
    category,
    originalFileName: file.name,
    storagePath: path,
    downloadUrl: url,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: serverTimestamp(),
  })
}

/**
 * 5MB max, PDF + JPG + PNG. Writes uploads subdoc and returns URLs for the parent party record.
 */
export async function uploadRosterPartyKyc5mb(
  entity: RosterEntity,
  entityId: string,
  category: UserUploadCategory,
  file: File,
): Promise<{ downloadUrl: string; storagePath: string; originalFileName: string }> {
  const bucket = getStorageOrThrow()
  const fs = getDb()
  assertRosterPartyKyc5mb(file)
  const path = `${entity}/${entityId}/documents/${category}_${Date.now()}_${safeFileSuffix(file.name)}`
  const storageRef = ref(bucket, path)
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { category, entity, entityId },
  })
  const downloadUrl = await getDownloadURL(storageRef)

  await addDoc(collection(fs, entity, entityId, 'uploads'), {
    category,
    originalFileName: file.name,
    storagePath: path,
    downloadUrl,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: serverTimestamp(),
  })
  return { downloadUrl, storagePath: path, originalFileName: file.name }
}

export async function deleteRosterUpload(
  entity: RosterEntity,
  entityId: string,
  upload: UserUploadRecord,
): Promise<void> {
  const bucket = getStorageOrThrow()
  const fs = getDb()
  try {
    await deleteObject(ref(bucket, upload.storagePath))
  } catch {
    /* already removed */
  }
  await deleteDoc(doc(fs, entity, entityId, 'uploads', upload.id))
}
