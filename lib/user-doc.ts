import { Timestamp } from 'firebase/firestore'
import type { User, UserRole } from '@/lib/types'

const ROLES: UserRole[] = [
  'admin',
  'property_manager',
  'owner',
  'tenant',
  'association_member',
]

export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

function parseRole(value: unknown): UserRole {
  const r = String(value ?? 'tenant')
  return (ROLES.includes(r as UserRole) ? r : 'tenant') as UserRole
}

/**
 * Normalizes Firestore `users/{id}` payloads into a `User` (handles Timestamp fields).
 */
export function deserializeUser(id: string, data: Record<string, unknown>): User {
  const lang = data.languagePreference === 'ar' ? 'ar' : 'en'
  return {
    id,
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    nameEn: String(data.nameEn ?? ''),
    nameAr: String(data.nameAr ?? ''),
    role: parseRole(data.role),
    languagePreference: lang,
    avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
    avatarStoragePath: data.avatarStoragePath ? String(data.avatarStoragePath) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}
