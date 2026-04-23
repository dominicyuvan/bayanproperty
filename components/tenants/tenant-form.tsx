'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { createTenantRecord } from '@/lib/tenants-db'
import type { TenantLeaseStatus } from '@/lib/types'

const leaseStatuses: TenantLeaseStatus[] = ['active', 'expired', 'pending']

type TenantFormData = {
  nameEn: string
  email: string
  phone: string
  unitNumber: string
  leaseStatus: TenantLeaseStatus
}

interface TenantFormProps {
  onSuccess?: () => void
}

function normalizeOmanPhone(phone: string): string {
  const digits = phone.replace(/\s/g, '')
  if (digits.startsWith('+968')) return digits
  if (digits.startsWith('968')) return `+${digits}`
  return `+968${digits}`
}

export function TenantForm({ onSuccess }: TenantFormProps) {
  const t = useTranslations('tenants')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const tenantSchema = useMemo(
    () =>
      z.object({
        nameEn: z.string().min(2, tErrors('minLength', { min: 2 })),
        email: z.string().email(tErrors('invalidEmail')),
        phone: z.string().regex(/^(\+968)?[0-9]{8}$/, tErrors('invalidPhone')),
        unitNumber: z.string().min(1, tErrors('required')).max(80),
        leaseStatus: z.enum(['active', 'expired', 'pending']),
      }),
    [tErrors],
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      nameEn: '',
      email: '',
      phone: '',
      unitNumber: '',
      leaseStatus: 'pending',
    },
  })

  const onSubmit = async (data: TenantFormData) => {
    if (!user) {
      toast.error(tErrors('unauthorized'))
      return
    }
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }

    setIsLoading(true)
    try {
      const name = data.nameEn.trim()
      await createTenantRecord({
        nameEn: name,
        nameAr: name,
        email: data.email,
        phone: normalizeOmanPhone(data.phone),
        unitNumber: data.unitNumber,
        leaseStatus: data.leaseStatus,
      })
      toast.success(t('tenantSaved'))
      onSuccess?.()
    } catch (error: unknown) {
      console.error(error)
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : ''
      if (code === 'permission-denied') {
        toast.error(tErrors('firestorePermissionDenied'))
      } else {
        toast.error(tErrors('somethingWentWrong'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="tenant-nameEn">{tCommon('name')}</FieldLabel>
          <Input
            id="tenant-nameEn"
            placeholder="Tenant name"
            {...register('nameEn')}
            className={errors.nameEn ? 'border-destructive' : ''}
          />
          {errors.nameEn && (
            <p className="text-sm text-destructive">{errors.nameEn.message}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tenant-email">{tCommon('email')}</FieldLabel>
            <Input
              id="tenant-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.om"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="tenant-phone">{tCommon('phone')}</FieldLabel>
            <Input
              id="tenant-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+968 9912 3456"
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tenant-unitNumber">{t('currentUnit')}</FieldLabel>
            <Input
              id="tenant-unitNumber"
              placeholder="e.g. A-101"
              {...register('unitNumber')}
              className={errors.unitNumber ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">{t('unitNumberHelp')}</p>
            {errors.unitNumber && (
              <p className="text-sm text-destructive">{errors.unitNumber.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel>{t('leaseStatus')}</FieldLabel>
            <Controller
              name="leaseStatus"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" id="tenant-leaseStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`lease.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
