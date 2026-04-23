'use client'

import { useState } from 'react'
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
import { UNIT_TYPES } from '@/lib/types'

const unitSchema = z.object({
  propertyId: z.string().min(1, 'Please select a property'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  type: z.enum(['apartment', 'studio', 'penthouse', 'office', 'shop', 'warehouse', 'villa']),
  floor: z.coerce.number().int().min(0, 'Floor must be 0 or higher'),
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or higher'),
  bathrooms: z.number().min(1, 'Must have at least 1 bathroom'),
  areaSquareMeters: z.number().min(1, 'Area must be greater than 0'),
  monthlyRent: z.number().min(0, 'Rent must be 0 or higher'),
  status: z.enum(['vacant', 'occupied', 'maintenance', 'reserved']),
})

type UnitFormData = z.infer<typeof unitSchema>

const demoProperties: Array<{ id: string; nameEn: string; nameAr: string }> = []

interface UnitFormProps {
  onSuccess?: () => void
  initialData?: Partial<UnitFormData>
}

export function UnitForm({ onSuccess, initialData }: UnitFormProps) {
  const t = useTranslations('units')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      type: 'apartment',
      status: 'vacant',
      floor: 0,
      bedrooms: 1,
      bathrooms: 1,
      ...initialData,
    },
  })

  const onSubmit = async (data: UnitFormData) => {
    setIsLoading(true)
    try {
      // TODO: Save to Firebase
      console.log('Unit data:', data)
      toast.success('Unit saved successfully')
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
        <Field>
          <FieldLabel htmlFor="propertyId">Property</FieldLabel>
          <Select
            value={watch('propertyId')}
            onValueChange={(value) => setValue('propertyId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {demoProperties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyId && (
            <p className="text-sm text-destructive">{errors.propertyId.message}</p>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
