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

// Property Status
export const PROPERTY_STATUSES = ['new', 'under_construction', 'complete'] as const
export type PropertyStatus = typeof PROPERTY_STATUSES[number]

// Property Usage
export const PROPERTY_USAGES = ['residential', 'commercial', 'mixed'] as const
export type PropertyUsage = typeof PROPERTY_USAGES[number]

// Property Contract Type
export const PROPERTY_CONTRACT_TYPES = ['for_rent', 'for_sale', 'for_rent_and_sale'] as const
export type PropertyContractType = typeof PROPERTY_CONTRACT_TYPES[number]

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

// Unit Usage
export const UNIT_USAGES = ['for_rent', 'for_sale'] as const
export type UnitUsage = typeof UNIT_USAGES[number]

// Unit Status
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance' | 'reserved'

// Contact Salutation
export const CONTACT_SALUTATIONS = ['mr', 'mrs', 'ms', 'dr', 'prof', 'eng'] as const
export type ContactSalutation = typeof CONTACT_SALUTATIONS[number]

// Contact Lead Source
export const LEAD_SOURCES = ['referral', 'website', 'direct', 'agent', 'social_media', 'other'] as const
export type LeadSource = typeof LEAD_SOURCES[number]

// Lease Contract Status
export const LEASE_CONTRACT_STATUSES = ['draft', 'active', 'expired', 'terminated'] as const
export type LeaseContractStatus = typeof LEASE_CONTRACT_STATUSES[number]

// Lease Payment Method
export const LEASE_PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'pdc'] as const
export type LeasePaymentMethod = typeof LEASE_PAYMENT_METHODS[number]

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
  languagePreference: 'en'
  avatarUrl?: string
  /** Firebase Storage path for the current profile photo (used to delete old file on replace) */
  avatarStoragePath?: string
  createdAt: Date
  updatedAt: Date
}

/** KYC / contract file stored under `users/{uid}/uploads` */
export type UserUploadCategory =
  | 'national_id'
  | 'residence_visa'
  | 'passport'
  | 'cr_certificate'
  | 'lease_agreement'
  | 'proof_of_address'
  | 'other'

export interface UserUploadRecord {
  id: string
  category: UserUploadCategory
  originalFileName: string
  storagePath: string
  downloadUrl: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

/** Lease roster entry (dashboard-managed; optional `userId` when linked to Auth) */
export type TenantLeaseStatus = 'active' | 'expired' | 'pending'

/** Individual vs company (Oman roster) */
export type PartyType = 'individual' | 'company'

/** Government ID / travel document (individual) */
export type IndividualIdTypeOman = 'national_id' | 'residency' | 'passport'

export interface TenantRecord {
  id: string
  partyType: PartyType
  salutation?: ContactSalutation
  firstName?: string
  lastName?: string
  nameEn: string
  nameAr: string
  email: string
  phone: string
  mobile?: string
  title?: string
  /** Display label for occupied unit (e.g. A-101) */
  unitNumber: string
  leaseStatus: TenantLeaseStatus
  userId?: string
  /** Individual-only */
  nationality?: string
  individualIdType?: IndividualIdTypeOman
  idNumber?: string
  idExpiryDate?: Date
  idDocumentUrl?: string
  idDocumentFileName?: string
  idDocumentStoragePath?: string
  /** Company-only */
  crNumber?: string
  crExpiryDate?: Date
  contactPersonName?: string
  contactPersonPhone?: string
  crCertificateUrl?: string
  crCertificateFileName?: string
  crCertificateStoragePath?: string
  iban?: string
  mailingStreet?: string
  mailingCity?: string
  mailingStateProvince?: string
  mailingZip?: string
  mailingCountry?: string
  birthdate?: Date
  leadSource?: LeadSource
  department?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

/** Owner roster entry (dashboard-managed) */
export interface OwnerRecord {
  id: string
  partyType: PartyType
  nameEn: string
  nameAr: string
  email: string
  phone: string
  propertyCount: number
  unitCount: number
  nationality?: string
  individualIdType?: IndividualIdTypeOman
  idNumber?: string
  idExpiryDate?: Date
  idDocumentUrl?: string
  idDocumentFileName?: string
  idDocumentStoragePath?: string
  crNumber?: string
  crExpiryDate?: Date
  contactPersonName?: string
  contactPersonPhone?: string
  crCertificateUrl?: string
  crCertificateFileName?: string
  crCertificateStoragePath?: string
  iban?: string
  createdAt: Date
  updatedAt: Date
}

// Property
export interface Property {
  id: string
  /** Business reference, e.g. BAY-MSC-2026-K7F2A */
  code?: string
  /** Land registry / cadastral plot reference */
  plotNumber?: string
  nameEn: string
  nameAr: string
  type: PropertyType
  status: PropertyStatus
  usage?: PropertyUsage
  contractType?: PropertyContractType
  completionPercent?: number
  startDate?: Date
  handoverDate?: Date
  landAreaSqm?: number
  builtUpAreaSqm?: number
  nationalAddress?: string
  governorate: OmanGovernorate
  city: string
  addressEn: string
  addressAr: string
  totalUnits: number
  /** Denormalized occupied count; updated when units are linked */
  occupiedUnits?: number
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
  unitCode?: string
  isActive: boolean
  nameEn?: string
  nameAr?: string
  descriptionEn?: string
  descriptionAr?: string
  usage: UnitUsage
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
  /** Total sellable area used for fee basis (m²) */
  sellableAreaSquareMeters: number
  /** Annual association fee rate (OMR per m²) */
  annualFeePerSquareMeterOmr: number
  /** Annual fee = sellableAreaSquareMeters × annualFeePerSquareMeterOmr (OMR) */
  annualBudget: number
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

// Lease Contract
export interface LeaseContract {
  id: string
  contractNumber: string
  tenantId: string
  propertyId: string
  unitId: string
  status: LeaseContractStatus
  paymentMethod?: LeasePaymentMethod
  contractType: 'rental'
  contractStartDate: Date
  contractEndDate?: Date
  contractTermMonths?: number
  specialTerms?: string
  description?: string
  customerSignedBy?: string
  customerSignedDate?: Date
  companySignedBy?: string
  companySignedDate?: Date
  createdAt: Date
  updatedAt: Date
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
