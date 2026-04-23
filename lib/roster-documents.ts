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
