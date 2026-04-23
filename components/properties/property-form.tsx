'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { createPropertyRecord } from '@/lib/properties-db'
import { MUSCAT_DISTRICT_KEYS, MUSCAT_DISTRICT_SET } from '@/lib/muscat-districts'
import { OMAN_GOVERNORATES, PROPERTY_TYPES, type OmanGovernorate } from '@/lib/types'

type PropertyFormData = {
  code: string
  plotNumber: string
  nameEn: string
  type: (typeof PROPERTY_TYPES)[number]
  governorate: string
  city: string
  addressEn: string
  totalUnits: number
  amenities?: string
}

interface PropertyFormProps {
  onSuccess?: () => void
  initialData?: Partial<PropertyFormData>
}

export function PropertyForm({ onSuccess, initialData }: PropertyFormProps) {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const tForms = useTranslations('forms')
  const tGov = useTranslations('governorates')
  const tErrors = useTranslations('errors')
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const propertySchema = useMemo(
    () =>
      z
        .object({
          code: z.string().max(80),
          plotNumber: z.string().max(80),
          nameEn: z.string().min(2, tErrors('minLength', { min: 2 })),
          type: z.enum([
            'residential_building',
            'commercial_building',
            'mixed_use',
            'villa_compound',
            'single_villa',
          ]),
          governorate: z.string().min(1, tErrors('required')),
          city: z.string().min(1, tErrors('required')),
          addressEn: z.string().min(5, tErrors('minLength', { min: 5 })),
          totalUnits: z.coerce.number().min(1, tErrors('required')),
          amenities: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.governorate === 'Muscat') {
            if (!MUSCAT_DISTRICT_SET.has(data.city)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['city'],
                message: t('selectMuscatArea'),
              })
            }
          } else if (data.city.trim().length < 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['city'],
              message: tErrors('minLength', { min: 2 }),
            })
          }
        }),
    [t, tErrors],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      code: '',
      plotNumber: '',
      nameEn: '',
      type: 'residential_building',
      governorate: '',
      city: '',
      addressEn: '',
      totalUnits: 1,
      amenities: '',
      ...initialData,
    },
  })

  const governorate = watch('governorate')

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      toast.error(tErrors('unauthorized'))
      return
    }
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }

    setIsLoading(true)
    const SAVE_TIMEOUT_MS = 45_000
    const name = data.nameEn.trim()
    const address = data.addressEn.trim()
    try {
      const amenities =
        data.amenities
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? []
      const plot = data.plotNumber?.trim()
      const codeTrim = data.code?.trim()
      const savePromise = createPropertyRecord({
        ...(codeTrim ? { code: codeTrim } : {}),
        ...(plot ? { plotNumber: plot } : {}),
        nameEn: name,
        nameAr: name,
        type: data.type,
        governorate: data.governorate as OmanGovernorate,
        city: data.city.trim(),
        addressEn: address,
        addressAr: address,
        totalUnits: data.totalUnits,
        amenities,
        managerId: user.id,
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
      toast.success(t('propertySaved'))
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code">{tForms('propertyCode')}</FieldLabel>
          <p className="text-xs text-muted-foreground">{tForms('propertyCodeHelp')}</p>
          <Input
            id="code"
            placeholder="e.g. PROP-001"
            autoComplete="off"
            {...register('code')}
            className={errors.code ? 'border-destructive' : ''}
          />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="nameEn">{t('propertyName')}</FieldLabel>
          <Input
            id="nameEn"
            placeholder="Property name"
            autoComplete="off"
            {...register('nameEn')}
            className={errors.nameEn ? 'border-destructive' : ''}
          />
          {errors.nameEn && (
            <p className="text-sm text-destructive">{errors.nameEn.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="plotNumber">{t('plotNumber')}</FieldLabel>
          <Input
            id="plotNumber"
            placeholder="e.g. 123 / Block 4"
            autoComplete="off"
            {...register('plotNumber')}
            className={errors.plotNumber ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">{t('plotNumberHelp')}</p>
          {errors.plotNumber && (
            <p className="text-sm text-destructive">{errors.plotNumber.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="type">{t('propertyType')}</FieldLabel>
          <Select
            value={watch('type')}
            onValueChange={(value) => setValue('type', value as PropertyFormData['type'])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('propertyType')} />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="governorate">{t('governorate')}</FieldLabel>
            <Select
              value={watch('governorate') || undefined}
              onValueChange={(value) => {
                setValue('governorate', value, { shouldValidate: true })
                setValue('city', '', { shouldValidate: true })
              }}
            >
              <SelectTrigger id="governorate">
                <SelectValue placeholder={t('governorate')} />
              </SelectTrigger>
              <SelectContent>
                {OMAN_GOVERNORATES.map((gov) => (
                  <SelectItem key={gov} value={gov}>
                    {tGov(gov)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.governorate && (
              <p className="text-sm text-destructive">{errors.governorate.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="city">{t('city')}</FieldLabel>
            {!governorate ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                {t('cityPickGovernorateFirst')}
              </p>
            ) : governorate === 'Muscat' ? (
              <Select
                value={watch('city') || undefined}
                onValueChange={(value) => setValue('city', value, { shouldValidate: true })}
              >
                <SelectTrigger id="city" className={errors.city ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('selectCityArea')} />
                </SelectTrigger>
                <SelectContent>
                  {MUSCAT_DISTRICT_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`muscatDistricts.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="city"
                placeholder={t('cityPlaceholderOther')}
                {...register('city')}
                className={errors.city ? 'border-destructive' : ''}
              />
            )}
            {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="addressEn">{tCommon('address')}</FieldLabel>
          <Textarea
            id="addressEn"
            placeholder="Full address"
            rows={3}
            {...register('addressEn')}
            className={errors.addressEn ? 'border-destructive' : ''}
          />
          {errors.addressEn && (
            <p className="text-sm text-destructive">{errors.addressEn.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="totalUnits">{t('totalUnits')}</FieldLabel>
          <Input
            id="totalUnits"
            type="number"
            min={1}
            placeholder="0"
            {...register('totalUnits', { valueAsNumber: true })}
            className={errors.totalUnits ? 'border-destructive' : ''}
          />
          {errors.totalUnits && (
            <p className="text-sm text-destructive">{errors.totalUnits.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="amenities">{t('amenities')}</FieldLabel>
          <Input
            id="amenities"
            placeholder="Pool, Gym, Parking (comma separated)"
            {...register('amenities')}
          />
          <p className="text-xs text-muted-foreground">Separate amenities with commas</p>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
