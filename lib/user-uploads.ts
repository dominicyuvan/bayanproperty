import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { auth, db, storage } from '@/lib/firebase'
import type { UserUploadCategory, UserUploadRecord } from '@/lib/types'
import { toDate } from '@/lib/user-doc'

export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const KYC_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024
export const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const KYC_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

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

export function assertProfileImage(file: File) {
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error('AVATAR_TOO_LARGE')
  }
  if (!PROFILE_IMAGE_TYPES.includes(file.type as (typeof PROFILE_IMAGE_TYPES)[number])) {
    throw new Error('AVATAR_BAD_TYPE')
  }
}

export function assertKycFile(file: File) {
  if (file.size > KYC_DOCUMENT_MAX_BYTES) {
    throw new Error('DOC_TOO_LARGE')
  }
  if (!KYC_DOCUMENT_TYPES.includes(file.type as (typeof KYC_DOCUMENT_TYPES)[number])) {
    throw new Error('DOC_BAD_TYPE')
  }
}

/** Maps a Firestore `uploads` subdocument (user, tenant, or owner). */
export function mapUploadDoc(id: string, data: Record<string, unknown>): UserUploadRecord {
  const cat = String(data.category ?? 'other')
  const categories: UserUploadCategory[] = [
    'national_id',
    'residence_visa',
    'lease_agreement',
    'proof_of_address',
    'other',
  ]
  return {
    id,
    category: (categories.includes(cat as UserUploadCategory) ? cat : 'other') as UserUploadCategory,
    originalFileName: String(data.originalFileName ?? ''),
    storagePath: String(data.storagePath ?? ''),
    downloadUrl: String(data.downloadUrl ?? ''),
    mimeType: String(data.mimeType ?? ''),
    sizeBytes: Math.max(0, Number(data.sizeBytes) || 0),
    createdAt: toDate(data.createdAt),
  }
}

export function subscribeUserUploads(
  uid: string,
  onData: (rows: UserUploadRecord[]) => void,
  onError?: (e: Error) => void,
): () => void {
  if (!db) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, 'users', uid, 'uploads'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => mapUploadDoc(d.id, d.data() as Record<string, unknown>)))
    },
    (err) => onError?.(err as Error),
  )
}

export async function uploadProfileAvatar(
  uid: string,
  file: File,
  previousStoragePath?: string | null,
): Promise<void> {
  const bucket = getStorageOrThrow()
  const fs = getDb()
  assertProfileImage(file)

  const path = `users/${uid}/profile/avatar_${Date.now()}_${safeFileSuffix(file.name)}`
  const storageRef = ref(bucket, path)
  await uploadBytes(storageRef, file, { contentType: file.type })
  const url = await getDownloadURL(storageRef)

  if (previousStoragePath) {
    try {
      await deleteObject(ref(bucket, previousStoragePath))
    } catch {
      /* stale path */
    }
  }

  await setDoc(
    doc(fs, 'users', uid),
    {
      avatarUrl: url,
      avatarStoragePath: path,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  if (auth?.currentUser?.uid === uid) {
    await updateProfile(auth.currentUser, { photoURL: url })
  }
}

export async function uploadKycDocument(uid: string, category: UserUploadCategory, file: File): Promise<void> {
  const bucket = getStorageOrThrow()
  const fs = getDb()
  assertKycFile(file)

  const path = `users/${uid}/documents/${category}_${Date.now()}_${safeFileSuffix(file.name)}`
  const storageRef = ref(bucket, path)
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { category, uploadedBy: uid },
  })
  const url = await getDownloadURL(storageRef)

  await addDoc(collection(fs, 'users', uid, 'uploads'), {
    category,
    originalFileName: file.name,
    storagePath: path,
    downloadUrl: url,
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: serverTimestamp(),
  })
}

export async function deleteUserUpload(uid: string, upload: UserUploadRecord): Promise<void> {
  const bucket = getStorageOrThrow()
  const fs = getDb()
  try {
    await deleteObject(ref(bucket, upload.storagePath))
  } catch {
    /* already removed */
  }
  await deleteDoc(doc(fs, 'users', uid, 'uploads', upload.id))
}
