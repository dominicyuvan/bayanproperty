'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/auth-context'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { createUnitRecord } from '@/lib/units-db'
import { subscribeProperties } from '@/lib/properties-db'
import { UNIT_TYPES, type Property } from '@/lib/types'

interface UnitFormProps {
  onSuccess?: () => void
  initialData?: Partial<UnitFormData>
}

type UnitFormData = {
  propertyId: string
  unitNumber: string
  type: z.infer<typeof unitTypeEnum>
  floor: number
  bedrooms: number
  bathrooms: number
  areaSquareMeters: number
  monthlyRent: number
  status: z.infer<typeof unitStatusEnum>
}

const unitTypeEnum = z.enum([
  'apartment',
  'studio',
  'penthouse',
  'office',
  'shop',
  'warehouse',
  'villa',
])

const unitStatusEnum = z.enum(['vacant', 'occupied', 'maintenance', 'reserved'])

export function UnitForm({ onSuccess, initialData }: UnitFormProps) {
  const t = useTranslations('units')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])

  const unitSchema = useMemo(
    () =>
      z.object({
        propertyId: z.string().min(1, t('selectPropertyError')),
        unitNumber: z.string().min(1, t('unitNumberRequired')),
        type: unitTypeEnum,
        floor: z.coerce.number().int().min(0, t('floorMin')),
        bedrooms: z.number().min(0, t('bedroomsMin')),
        bathrooms: z.number().min(1, t('bathroomsMin')),
        areaSquareMeters: z.number().min(1, t('areaMin')),
        monthlyRent: z.number().min(0, t('rentMin')),
        status: unitStatusEnum,
      }),
    [t],
  )

  useEffect(() => {
    const unsubscribe = subscribeProperties(
      (rows) => setProperties(rows),
      (err) => console.error(err),
    )
    return () => unsubscribe()
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      propertyId: '',
      type: 'apartment',
      status: 'vacant',
      floor: 0,
      bedrooms: 1,
      bathrooms: 1,
      ...initialData,
    },
  })

  const onSubmit = async (data: UnitFormData) => {
    if (!user) {
      toast.error(tErrors('unauthorized'))
      return
    }
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }
    if (properties.length === 0) {
      toast.error(t('addPropertyFirst'))
      return
    }

    const SAVE_TIMEOUT_MS = 45_000
    try {
      const savePromise = createUnitRecord({
        propertyId: data.propertyId,
        unitNumber: data.unitNumber,
        type: data.type,
        floor: data.floor,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSquareMeters: data.areaSquareMeters,
        monthlyRent: data.monthlyRent,
        status: data.status,
      })
      let saveTimeoutId: ReturnType<typeof setTimeout> | undefined
      const timeoutPromise = new Promise<never>((_, reject) => {
        saveTimeoutId = setTimeout(() => {
          reject(Object.assign(new Error('Save timed out'), { code: 'save-timeout' }))
        }, SAVE_TIMEOUT_MS)
      })
      try {
        await Promise.race([savePromise, timeoutPromise])
      } finally {
        if (saveTimeoutId !== undefined) clearTimeout(saveTimeoutId)
      }
      toast.success(t('unitSaved'))
      onSuccess?.()
    } catch (error: unknown) {
      console.error(error)
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : ''
      if (code === 'permission-denied') {
        toast.error(tErrors('firestorePermissionDenied'))
      } else if (code === 'save-timeout') {
        toast.error(tErrors('saveTimedOut'))
      } else {
        toast.error(tErrors('somethingWentWrong'))
      }
    }
  }

  const noProperties = properties.length === 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="propertyId">{t('linkedProperty')}</FieldLabel>
          <Select
            value={watch('propertyId') || undefined}
            onValueChange={(value) => setValue('propertyId', value, { shouldValidate: true })}
            disabled={noProperties}
          >
            <SelectTrigger id="propertyId" className={errors.propertyId ? 'border-destructive' : ''}>
              <SelectValue placeholder={t('selectPropertyPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyId && (
            <p className="text-sm text-destructive">{errors.propertyId.message}</p>
          )}
          {noProperties && (
            <p className="text-sm text-muted-foreground">{t('addPropertyFirst')}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="unitNumber">{t('unitNumber')}</FieldLabel>
            <Input
              id="unitNumber"
              placeholder="A-101"
              {...register('unitNumber')}
              className={errors.unitNumber ? 'border-destructive' : ''}
            />
            {errors.unitNumber && (
              <p className="text-sm text-destructive">{errors.unitNumber.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="floor">{t('floor')}</FieldLabel>
            <Input
              id="floor"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              {...register('floor', { valueAsNumber: true })}
              className={errors.floor ? 'border-destructive' : ''}
            />
            {errors.floor && <p className="text-sm text-destructive">{errors.floor.message}</p>}
          </Field>

          <Field className="sm:col-span-2 lg:col-span-1">
            <FieldLabel htmlFor="type">{t('unitType')}</FieldLabel>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as UnitFormData['type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('unitType')} />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="bedrooms">{t('bedrooms')}</FieldLabel>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              {...register('bedrooms', { valueAsNumber: true })}
              className={errors.bedrooms ? 'border-destructive' : ''}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bathrooms">{t('bathrooms')}</FieldLabel>
            <Input
              id="bathrooms"
              type="number"
              min={1}
              {...register('bathrooms', { valueAsNumber: true })}
              className={errors.bathrooms ? 'border-destructive' : ''}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="areaSquareMeters">{t('area')}</FieldLabel>
            <Input
              id="areaSquareMeters"
              type="number"
              min={1}
              placeholder="120"
              {...register('areaSquareMeters', { valueAsNumber: true })}
              className={errors.areaSquareMeters ? 'border-destructive' : ''}
            />
            {errors.areaSquareMeters && (
              <p className="text-sm text-destructive">{errors.areaSquareMeters.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="monthlyRent">{t('monthlyRent')} (OMR)</FieldLabel>
            <Input
              id="monthlyRent"
              type="number"
              min={0}
              step="0.001"
              placeholder="450.000"
              {...register('monthlyRent', { valueAsNumber: true })}
              className={errors.monthlyRent ? 'border-destructive' : ''}
            />
            {errors.monthlyRent && (
              <p className="text-sm text-destructive">{errors.monthlyRent.message}</p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="status">{tCommon('status')}</FieldLabel>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as UnitFormData['status'])}
          >
            <SelectTrigger>
              <SelectValue placeholder={tCommon('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">{t('status.vacant')}</SelectItem>
              <SelectItem value="occupied">{t('status.occupied')}</SelectItem>
              <SelectItem value="maintenance">{t('status.maintenance')}</SelectItem>
              <SelectItem value="reserved">{t('status.reserved')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || noProperties}>
          {isSubmitting ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
