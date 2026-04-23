import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function normalizeOmanPhone(phone: string): string {
  const digits = phone.replace(/\s/g, '')
  if (digits.startsWith('+968')) return digits
  if (digits.startsWith('968')) return `+${digits}`
  return `+968${digits}`
}

export async function saveUserLanguagePreference(uid: string, languagePreference: 'en' | 'ar'): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  await setDoc(
    doc(db, 'users', uid),
    { languagePreference, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function saveUserProfileFields(
  uid: string,
  fields: {
    nameEn: string
    nameAr: string
    phone: string
    languagePreference?: 'en' | 'ar'
  },
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized')
  await setDoc(
    doc(db, 'users', uid),
    {
      nameEn: fields.nameEn.trim(),
      nameAr: fields.nameAr.trim(),
      phone: normalizeOmanPhone(fields.phone),
      ...(fields.languagePreference ? { languagePreference: fields.languagePreference } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
