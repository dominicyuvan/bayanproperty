'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { createOwnerRecord } from '@/lib/owners-db'

type OwnerFormData = {
  nameEn: string
  email: string
  phone: string
  propertyCount: number
  unitCount: number
}

interface OwnerFormProps {
  onSuccess?: () => void
}

function normalizeOmanPhone(phone: string): string {
  const digits = phone.replace(/\s/g, '')
  if (digits.startsWith('+968')) return digits
  if (digits.startsWith('968')) return `+${digits}`
  return `+968${digits}`
}

export function OwnerForm({ onSuccess }: OwnerFormProps) {
  const t = useTranslations('owners')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        nameEn: z.string().min(2, tErrors('minLength', { min: 2 })),
        email: z.string().email(tErrors('invalidEmail')),
        phone: z.string().regex(/^(\+968)?[0-9]{8}$/, tErrors('invalidPhone')),
        propertyCount: z.coerce.number().int().min(0),
        unitCount: z.coerce.number().int().min(0),
      }),
    [tErrors],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: '',
      email: '',
      phone: '',
      propertyCount: 0,
      unitCount: 0,
    },
  })

  const onSubmit = async (data: OwnerFormData) => {
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }
    setIsLoading(true)
    try {
      const name = data.nameEn.trim()
      await createOwnerRecord({
        nameEn: name,
        nameAr: name,
        email: data.email,
        phone: normalizeOmanPhone(data.phone),
        propertyCount: data.propertyCount,
        unitCount: data.unitCount,
      })
      toast.success(t('ownerSaved'))
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
          <FieldLabel htmlFor="owner-name">{tCommon('name')}</FieldLabel>
          <Input
            id="owner-name"
            placeholder="Owner name"
            {...register('nameEn')}
            className={errors.nameEn ? 'border-destructive' : ''}
          />
          {errors.nameEn && <p className="text-sm text-destructive">{errors.nameEn.message}</p>}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="owner-email">{tCommon('email')}</FieldLabel>
            <Input
              id="owner-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </Field>
          <Field>
            <FieldLabel htmlFor="owner-phone">{tCommon('phone')} (+968)</FieldLabel>
            <Input
              id="owner-phone"
              type="tel"
              autoComplete="tel"
              placeholder="99123456"
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="owner-properties">{t('propertyCount')}</FieldLabel>
            <Input
              id="owner-properties"
              type="number"
              min={0}
              step={1}
              {...register('propertyCount', { valueAsNumber: true })}
              className={errors.propertyCount ? 'border-destructive' : ''}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="owner-units">{t('unitCount')}</FieldLabel>
            <Input
              id="owner-units"
              type="number"
              min={0}
              step={1}
              {...register('unitCount', { valueAsNumber: true })}
              className={errors.unitCount ? 'border-destructive' : ''}
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
