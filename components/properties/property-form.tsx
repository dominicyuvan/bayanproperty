'use client'

import { useMemo } from 'react'
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
import {
  OMAN_GOVERNORATES,
  PROPERTY_CONTRACT_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_USAGES,
  type OmanGovernorate,
  type PropertyContractType,
  type PropertyStatus,
  type PropertyUsage,
} from '@/lib/types'

type PropertyFormData = {
  nameAr?: string
  plotNumber: string
  nameEn: string
  status: PropertyStatus
  type: (typeof PROPERTY_TYPES)[number]
  usage?: PropertyUsage
  contractType?: PropertyContractType
  completionPercent?: number
  startDate?: string
  handoverDate?: string
  landAreaSqm?: number
  builtUpAreaSqm?: number
  governorate: string
  city: string
  nationalAddress?: string
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
  const tGov = useTranslations('governorates')
  const tErrors = useTranslations('errors')
  const { user } = useAuth()

  const propertySchema = useMemo(
    () =>
      z
        .object({
          nameAr: z.string().optional(),
          plotNumber: z.string().max(80),
          nameEn: z.string().min(2, tErrors('minLength', { min: 2 })),
          status: z.enum(['new', 'under_construction', 'complete']),
          type: z.enum([
            'residential_building',
            'commercial_building',
            'mixed_use',
            'villa_compound',
            'single_villa',
          ]),
          usage: z.enum(['residential', 'commercial', 'mixed']).optional(),
          contractType: z.enum(['for_rent', 'for_sale', 'for_rent_and_sale']).optional(),
          completionPercent: z.coerce.number().min(0).max(100).optional(),
          startDate: z.string().optional(),
          handoverDate: z.string().optional(),
          landAreaSqm: z.coerce.number().min(0).optional(),
          builtUpAreaSqm: z.coerce.number().min(0).optional(),
          governorate: z.string().min(1, tErrors('required')),
          city: z.string().min(1, tErrors('required')),
          nationalAddress: z.string().optional(),
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
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      nameAr: '',
      plotNumber: '',
      nameEn: '',
      status: 'new',
      type: 'residential_building',
      usage: 'residential',
      contractType: 'for_rent',
      completionPercent: undefined,
      startDate: '',
      handoverDate: '',
      landAreaSqm: undefined,
      builtUpAreaSqm: undefined,
      governorate: '',
      city: '',
      nationalAddress: '',
      totalUnits: 1,
      amenities: '',
      ...initialData,
    },
  })

  const governorate = watch('governorate')
  const status = watch('status')

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      toast.error(tErrors('unauthorized'))
      return
    }
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }

    const SAVE_TIMEOUT_MS = 45_000
    const name = data.nameEn.trim()
    try {
      const amenities =
        data.amenities
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? []
      const plot = data.plotNumber?.trim()
      const savePromise = createPropertyRecord({
        ...(plot ? { plotNumber: plot } : {}),
        nameEn: name,
        nameAr: data.nameAr?.trim() || name,
        type: data.type,
        status: data.status,
        ...(data.usage ? { usage: data.usage } : {}),
        ...(data.contractType ? { contractType: data.contractType } : {}),
        ...(data.completionPercent != null ? { completionPercent: data.completionPercent } : {}),
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.handoverDate ? { handoverDate: new Date(data.handoverDate) } : {}),
        ...(data.landAreaSqm != null ? { landAreaSqm: data.landAreaSqm } : {}),
        ...(data.builtUpAreaSqm != null ? { builtUpAreaSqm: data.builtUpAreaSqm } : {}),
        ...(data.nationalAddress?.trim() ? { nationalAddress: data.nationalAddress.trim() } : {}),
        governorate: data.governorate as OmanGovernorate,
        city: data.city.trim(),
        addressEn: data.nationalAddress?.trim() || '',
        addressAr: '',
        totalUnits: data.totalUnits,
        images: [],
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
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wide">{t('sectionInformation')}</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="nameEn">{t('propertyName')}</FieldLabel>
          <Input
            id="nameEn"
            autoComplete="off"
            {...register('nameEn')}
            className={errors.nameEn ? 'border-destructive' : ''}
          />
          {errors.nameEn && (
            <p className="text-sm text-destructive">{errors.nameEn.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="nameAr">{t('propertyNameAr')}</FieldLabel>
          <Input
            id="nameAr"
            dir="rtl"
            autoComplete="off"
            {...register('nameAr')}
            className={errors.nameAr ? 'border-destructive' : ''}
          />
          {errors.nameAr ? <p className="text-sm text-destructive">{errors.nameAr.message}</p> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="plotNumber">{t('plotNumber')}</FieldLabel>
          <Input
            id="plotNumber"
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
          <FieldLabel htmlFor="status">{t('propertyStatus')}</FieldLabel>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as PropertyFormData['status'])}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder={t('propertyStatus')} />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{t('sectionPropertyInfo')}</h3>
      <FieldGroup>
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
            <FieldLabel htmlFor="usage">{t('propertyUsage')}</FieldLabel>
            <Select
              value={watch('usage') || undefined}
              onValueChange={(value) => setValue('usage', value as PropertyUsage)}
            >
              <SelectTrigger id="usage">
                <SelectValue placeholder={t('propertyUsage')} />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_USAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`usage.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="contractType">{t('propertyContractType')}</FieldLabel>
            <Select
              value={watch('contractType') || undefined}
              onValueChange={(value) => setValue('contractType', value as PropertyContractType)}
            >
              <SelectTrigger id="contractType">
                <SelectValue placeholder={t('propertyContractType')} />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_CONTRACT_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`contractType.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {status === 'under_construction' ? (
          <Field>
            <FieldLabel htmlFor="completionPercent">{t('completionPercent')}</FieldLabel>
            <Input
              id="completionPercent"
              type="number"
              min={0}
              max={100}
              {...register('completionPercent', { valueAsNumber: true })}
              className={errors.completionPercent ? 'border-destructive' : ''}
            />
            {errors.completionPercent ? (
              <p className="text-sm text-destructive">{errors.completionPercent.message}</p>
            ) : null}
          </Field>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="startDate">{t('startDate')}</FieldLabel>
            <Input id="startDate" type="date" {...register('startDate')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="handoverDate">{t('handoverDate')}</FieldLabel>
            <Input id="handoverDate" type="date" {...register('handoverDate')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="landAreaSqm">{t('landAreaSqm')}</FieldLabel>
            <Input
              id="landAreaSqm"
              type="number"
              min={0}
              {...register('landAreaSqm', { valueAsNumber: true })}
              className={errors.landAreaSqm ? 'border-destructive' : ''}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="builtUpAreaSqm">{t('builtUpAreaSqm')}</FieldLabel>
            <Input
              id="builtUpAreaSqm"
              type="number"
              min={0}
              {...register('builtUpAreaSqm', { valueAsNumber: true })}
              className={errors.builtUpAreaSqm ? 'border-destructive' : ''}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="totalUnits">{t('totalUnits')}</FieldLabel>
          <Input
            id="totalUnits"
            type="number"
            min={1}
            {...register('totalUnits', { valueAsNumber: true })}
            className={errors.totalUnits ? 'border-destructive' : ''}
          />
          {errors.totalUnits && (
            <p className="text-sm text-destructive">{errors.totalUnits.message}</p>
          )}
        </Field>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{t('sectionNationalAddress')}</h3>
      <FieldGroup>
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
          <FieldLabel htmlFor="nationalAddress">{t('nationalAddress')}</FieldLabel>
          <Input id="nationalAddress" {...register('nationalAddress')} />
        </Field>
      </FieldGroup>

      <h3 className="text-sm font-semibold tracking-wide">{tCommon('notes')}</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="amenities">{t('amenities')}</FieldLabel>
          <Textarea
            id="amenities"
            {...register('amenities')}
          />
          <p className="text-xs text-muted-foreground">{t('amenitiesHelp')}</p>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
