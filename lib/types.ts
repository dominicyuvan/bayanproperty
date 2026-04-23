// User Roles
export type UserRole = 'admin' | 'property_manager' | 'owner' | 'tenant' | 'association_member'

// Oman Governorates
export const OMAN_GOVERNORATES = [
  'Muscat',
  'Dhofar',
  'Musandam',
  'Al Buraimi',
  'Ad Dakhiliyah',
  'Al Batinah North',
  'Al Batinah South',
  'Ash Sharqiyah North',
  'Ash Sharqiyah South',
  'Ad Dhahirah',
  'Al Wusta',
] as const

export type OmanGovernorate = typeof OMAN_GOVERNORATES[number]

// Property Types
export const PROPERTY_TYPES = [
  'residential_building',
  'commercial_building',
  'mixed_use',
  'villa_compound',
  'single_villa',
] as const

export type PropertyType = typeof PROPERTY_TYPES[number]

// Unit Types
export const UNIT_TYPES = [
  'apartment',
  'studio',
  'penthouse',
  'office',
  'shop',
  'warehouse',
  'villa',
] as const

export type UnitType = typeof UNIT_TYPES[number]

// Unit Status
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance' | 'reserved'

// Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial'

// Payment Type
export type PaymentType = 'rent' | 'service_charge' | 'deposit' | 'utility' | 'maintenance' | 'other'

// Maintenance Priority
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'

// Maintenance Status
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled'

// Announcement Type
export type AnnouncementType = 'general' | 'urgent' | 'maintenance' | 'payment_reminder' | 'association'

// Announcement Target
export type AnnouncementTarget = 'all' | 'tenants' | 'owners' | 'association_members'

// Announcement Priority
export type AnnouncementPriority = 'normal' | 'high' | 'urgent'

// Notification Type
export type NotificationType = 'email' | 'sms' | 'in_app'

// Notification Status
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read'

// User
export interface User {
  id: string
  email: string
  phone: string // +968 format
  nameEn: string
  nameAr: string
  role: UserRole
  languagePreference: 'en' | 'ar'
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

// Property
export interface Property {
  id: string
  nameEn: string
  nameAr: string
  type: PropertyType
  governorate: OmanGovernorate
  city: string
  addressEn: string
  addressAr: string
  totalUnits: number
  managerId?: string
  associationId?: string
  images: string[]
  amenities: string[]
  createdAt: Date
  updatedAt: Date
}

// Unit
export interface Unit {
  id: string
  propertyId: string
  unitNumber: string
  type: UnitType
  floor: number
  bedrooms: number
  bathrooms: number
  areaSquareMeters: number
  monthlyRent: number // OMR
  status: UnitStatus
  tenantId?: string
  ownerId?: string
  leaseStartDate?: Date
  leaseEndDate?: Date
  images: string[]
  features: string[]
  createdAt: Date
  updatedAt: Date
}

// Owner's Association
export interface Association {
  id: string
  nameEn: string
  nameAr: string
  propertyIds: string[]
  chairpersonId?: string
  memberIds: string[]
  annualBudget: number // OMR
  meetingSchedule?: string
  contactEmail?: string
  contactPhone?: string // +968 format
  createdAt: Date
  updatedAt: Date
}

// Payment
export interface Payment {
  id: string
  unitId: string
  tenantId: string
  amount: number // OMR
  type: PaymentType
  status: PaymentStatus
  dueDate: Date
  paidDate?: Date
  method?: string
  reference?: string
  notes?: string
  notesAr?: string
  createdAt: Date
  updatedAt: Date
}

// Maintenance Request
export interface MaintenanceRequest {
  id: string
  unitId: string
  tenantId: string
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  assignedTo?: string
  images: string[]
  createdAt: Date
  resolvedAt?: Date
  updatedAt: Date
}

// Announcement
export interface Announcement {
  id: string
  title: string
  titleAr: string
  content: string
  contentAr: string
  type: AnnouncementType
  targetAudience: AnnouncementTarget
  propertyIds: string[] // Empty means all properties
  attachments: string[]
  priority: AnnouncementPriority
  publishedAt: Date
  expiresAt?: Date
  createdBy: string
  notificationsSent: {
    email: boolean
    sms: boolean
  }
  createdAt: Date
  updatedAt: Date
}

// Notification
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  titleAr: string
  message: string
  messageAr: string
  status: NotificationStatus
  relatedTo?: {
    type: 'announcement' | 'payment' | 'maintenance' | 'association'
    id: string
  }
  sentAt?: Date
  readAt?: Date
  createdAt: Date
}

// Notification Preferences
export interface NotificationPreferences {
  userId: string
  email: boolean
  sms: boolean
  categories: {
    announcements: { email: boolean; sms: boolean }
    payments: { email: boolean; sms: boolean }
    maintenance: { email: boolean; sms: boolean }
    association: { email: boolean; sms: boolean }
  }
}

// Helper function to format OMR currency
export function formatOMR(amount: number): string {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount)
}

// Helper function to format phone number
export function formatOmanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('968')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  }
  return `+968 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
}
