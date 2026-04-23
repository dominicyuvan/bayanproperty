'use client'

import { useState } from 'react'
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
import { OMAN_GOVERNORATES, PROPERTY_TYPES } from '@/lib/types'

const propertySchema = z.object({
  nameEn: z.string().min(2, 'Name must be at least 2 characters'),
  nameAr: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['residential_building', 'commercial_building', 'mixed_use', 'villa_compound', 'single_villa']),
  governorate: z.string().min(1, 'Please select a governorate'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  addressEn: z.string().min(5, 'Address must be at least 5 characters'),
  addressAr: z.string().min(5, 'Address must be at least 5 characters'),
  totalUnits: z.number().min(1, 'Must have at least 1 unit'),
  amenities: z.string().optional(),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface PropertyFormProps {
  onSuccess?: () => void
  initialData?: Partial<PropertyFormData>
}

export function PropertyForm({ onSuccess, initialData }: PropertyFormProps) {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const tGov = useTranslations('governorates')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      ...initialData,
      type: initialData?.type || 'residential_building',
    },
  })

  const onSubmit = async (data: PropertyFormData) => {
    setIsLoading(true)
    try {
      // TODO: Save to Firebase
      console.log('Property data:', data)
      toast.success('Property saved successfully')
      onSuccess?.()
    } catch (error) {
      toast.error(tErrors('somethingWentWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="nameEn">{t('propertyName')} (English)</FieldLabel>
            <Input
              id="nameEn"
              placeholder="Property name"
              {...register('nameEn')}
              className={errors.nameEn ? 'border-destructive' : ''}
            />
            {errors.nameEn && (
              <p className="text-sm text-destructive">{errors.nameEn.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="nameAr">{t('propertyName')} (عربي)</FieldLabel>
            <Input
              id="nameAr"
              placeholder="اسم العقار"
              dir="rtl"
              {...register('nameAr')}
              className={errors.nameAr ? 'border-destructive' : ''}
            />
            {errors.nameAr && (
              <p className="text-sm text-destructive">{errors.nameAr.message}</p>
            )}
          </Field>
        </div>

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
              value={watch('governorate')}
              onValueChange={(value) => setValue('governorate', value)}
            >
              <SelectTrigger>
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
            <Input
              id="city"
              placeholder="City"
              {...register('city')}
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="addressEn">{tCommon('address')} (English)</FieldLabel>
            <Textarea
              id="addressEn"
              placeholder="Full address"
              rows={2}
              {...register('addressEn')}
              className={errors.addressEn ? 'border-destructive' : ''}
            />
            {errors.addressEn && (
              <p className="text-sm text-destructive">{errors.addressEn.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="addressAr">{tCommon('address')} (عربي)</FieldLabel>
            <Textarea
              id="addressAr"
              placeholder="العنوان الكامل"
              dir="rtl"
              rows={2}
              {...register('addressAr')}
              className={errors.addressAr ? 'border-destructive' : ''}
            />
            {errors.addressAr && (
              <p className="text-sm text-destructive">{errors.addressAr.message}</p>
            )}
          </Field>
        </div>

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
