'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/auth-context'
import { createLeaseRecord, updateLeaseRecord } from '@/lib/leases-db'
import { subscribeProperties } from '@/lib/properties-db'
import { subscribeTenantRecords } from '@/lib/tenants-db'
import { subscribeUnits } from '@/lib/units-db'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { LeasePaymentMethod, LeaseContractStatus, Property, TenantRecord, Unit } from '@/lib/types'

type LeaseFormData = {
  tenantId: string
  status: LeaseContractStatus
  paymentMethod?: LeasePaymentMethod
  propertyId: string
  unitId: string
  contractStartDate: string
  contractTermMonths?: number
  contractEndDate?: string
  specialTerms?: string
  description?: string
  customerSignedBy?: string
  customerSignedDate?: string
  companySignedBy?: string
  companySignedDate?: string
}

interface LeaseContractFormProps {
  onSuccess?: () => void
  leaseId?: string
  initialData?: Partial<LeaseFormData>
}

export function LeaseContractForm({ onSuccess, leaseId, initialData }: LeaseContractFormProps) {
  const t = useTranslations('leases')
  const tErrors = useTranslations('errors')
  const tCommon = useTranslations('common')
  const tProperties = useTranslations('properties')
  const tUnits = useTranslations('units')
  const { user } = useAuth()
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  const leaseSchema = useMemo(
    () =>
      z.object({
        tenantId: z.string().min(1, tErrors('required')),
        status: z.enum(['draft', 'active', 'expired', 'terminated']),
        paymentMethod: z.enum(['bank_transfer', 'cash', 'cheque', 'pdc']).optional(),
        propertyId: z.string().min(1, tErrors('required')),
        unitId: z.string().min(1, tErrors('required')),
        contractStartDate: z.string().min(1, tErrors('required')),
        contractTermMonths: z.coerce.number().min(1).optional(),
        contractEndDate: z.string().optional(),
        specialTerms: z.string().max(2000).optional(),
        description: z.string().max(1000).optional(),
        customerSignedBy: z.string().max(120).optional(),
        customerSignedDate: z.string().optional(),
        companySignedBy: z.string().max(120).optional(),
        companySignedDate: z.string().optional(),
      }),
    [tErrors],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      tenantId: '',
      status: 'draft',
      paymentMethod: undefined,
      propertyId: '',
      unitId: '',
      contractStartDate: '',
      contractTermMonths: undefined,
      contractEndDate: '',
      specialTerms: '',
      description: '',
      customerSignedBy: '',
      customerSignedDate: '',
      companySignedBy: user?.nameEn || '',
      companySignedDate: '',
      ...initialData,
    },
  })

  useEffect(() => {
    const u1 = subscribeTenantRecords(setTenants)
    const u2 = subscribeProperties(setProperties)
    const u3 = subscribeUnits(setUnits)
    return () => {
      u1()
      u2()
      u3()
    }
  }, [])

  const watchedStartDate = watch('contractStartDate')
  const watchedTermMonths = watch('contractTermMonths')
  const watchedPropertyId = watch('propertyId')
  const watchedTenantId = watch('tenantId')

  useEffect(() => {
    if (watchedStartDate && watchedTermMonths) {
      const end = new Date(watchedStartDate)
      end.setMonth(end.getMonth() + watchedTermMonths)
      setValue('contractEndDate', end.toISOString().slice(0, 10))
    }
  }, [watchedStartDate, watchedTermMonths, setValue])

  useEffect(() => {
    const tenant = tenants.find((x) => x.id === watchedTenantId)
    if (tenant?.nameEn) setValue('customerSignedBy', tenant.nameEn)
  }, [watchedTenantId, tenants, setValue])

  const propertyUnits = units.filter((u) => u.propertyId === watchedPropertyId)

  const onSubmit = async (data: LeaseFormData) => {
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }
    try {
      const payload = {
        tenantId: data.tenantId,
        propertyId: data.propertyId,
        unitId: data.unitId,
        status: data.status,
        paymentMethod: data.paymentMethod,
        contractType: 'rental' as const,
        contractStartDate: new Date(data.contractStartDate),
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
        contractTermMonths: data.contractTermMonths,
        specialTerms: data.specialTerms,
        description: data.description,
        customerSignedBy: data.customerSignedBy,
        customerSignedDate: data.customerSignedDate ? new Date(data.customerSignedDate) : undefined,
        companySignedBy: data.companySignedBy,
        companySignedDate: data.companySignedDate ? new Date(data.companySignedDate) : undefined,
      }
      if (leaseId) {
        await updateLeaseRecord(leaseId, payload)
      } else {
        await createLeaseRecord(payload)
      }
      toast.success(leaseId ? tCommon('edit') : t('addLease'))
      onSuccess?.()
    } catch (error) {
      console.error(error)
      toast.error(tErrors('somethingWentWrong'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wide">{t('sectionContractInfo')}</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contractNumber">{t('contractNumber')}</FieldLabel>
          <Input id="contractNumber" readOnly value={t('autoContractNumber')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tenantId">{t('tenant')}</FieldLabel>
            <Select value={watch('tenantId') || undefined} onValueChange={(v) => setValue('tenantId', v)}>
              <SelectTrigger id="tenantId" className={errors.tenantId ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('tenant')} />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tenantId ? <p className="text-sm text-destructive">{errors.tenantId.message}</p> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="status">{tCommon('status')}</FieldLabel>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v as LeaseContractStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('status.draft')}</SelectItem>
                <SelectItem value="active">{t('status.active')}</SelectItem>
                <SelectItem value="expired">{t('status.expired')}</SelectItem>
                <SelectItem value="terminated">{t('status.terminated')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="paymentMethod">{t('paymentMethodLabel')}</FieldLabel>
          <Select
            value={watch('paymentMethod') || undefined}
            onValueChange={(v) => setValue('paymentMethod', v as LeasePaymentMethod)}
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder={t('paymentMethodLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">{t('paymentMethod.bank_transfer')}</SelectItem>
              <SelectItem value="cash">{t('paymentMethod.cash')}</SelectItem>
              <SelectItem value="cheque">{t('paymentMethod.cheque')}</SelectItem>
              <SelectItem value="pdc">{t('paymentMethod.pdc')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{t('sectionUnitInfo')}</h3>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="propertyId">{tProperties('title')}</FieldLabel>
            <Select
              value={watch('propertyId') || undefined}
              onValueChange={(v) => {
                setValue('propertyId', v)
                setValue('unitId', '')
              }}
            >
              <SelectTrigger id="propertyId" className={errors.propertyId ? 'border-destructive' : ''}>
                <SelectValue placeholder={tProperties('title')} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="unitId">{tUnits('title')}</FieldLabel>
            <Select value={watch('unitId') || undefined} onValueChange={(v) => setValue('unitId', v)}>
              <SelectTrigger id="unitId" className={errors.unitId ? 'border-destructive' : ''}>
                <SelectValue placeholder={tUnits('title')} />
              </SelectTrigger>
              <SelectContent>
                {propertyUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unitNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{t('sectionContractDetails')}</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contractTypeLabel">{t('contractTypeLabel')}</FieldLabel>
          <Input id="contractTypeLabel" readOnly value={t('contractTypeRental')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="contractStartDate">{t('startDate')}</FieldLabel>
            <Input id="contractStartDate" type="date" {...register('contractStartDate')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="contractTermMonths">{t('termMonths')}</FieldLabel>
            <Input
              id="contractTermMonths"
              type="number"
              min={1}
              {...register('contractTermMonths', { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="contractEndDate">{t('endDate')}</FieldLabel>
            <Input id="contractEndDate" type="date" {...register('contractEndDate')} />
          </Field>
        </div>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{t('sectionTerms')}</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="specialTerms">{t('specialTerms')}</FieldLabel>
          <Textarea id="specialTerms" rows={3} {...register('specialTerms')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">{t('description')}</FieldLabel>
          <Textarea id="description" rows={3} {...register('description')} />
        </Field>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{t('sectionSignatures')}</h3>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="customerSignedBy">{t('customerSignedBy')}</FieldLabel>
            <Input id="customerSignedBy" {...register('customerSignedBy')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="customerSignedDate">{t('customerSignedDate')}</FieldLabel>
            <Input id="customerSignedDate" type="date" {...register('customerSignedDate')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="companySignedBy">{t('companySignedBy')}</FieldLabel>
            <Input id="companySignedBy" {...register('companySignedBy')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="companySignedDate">{t('companySignedDate')}</FieldLabel>
            <Input id="companySignedDate" type="date" {...register('companySignedDate')} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
