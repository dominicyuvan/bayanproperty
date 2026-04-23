'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { useEnToArAutofill } from '@/hooks/use-en-to-ar-autofill'
import { formatOMR } from '@/lib/types'

const associationSchema = z.object({
  nameEn: z.string().min(2, 'Name must be at least 2 characters'),
  nameAr: z.string().min(2, 'Name must be at least 2 characters'),
  sellableAreaSquareMeters: z.coerce
    .number({ invalid_type_error: 'Enter sellable area' })
    .min(0.01, 'Sellable area must be greater than 0'),
  annualFeePerSquareMeterOmr: z.coerce
    .number({ invalid_type_error: 'Enter rate' })
    .min(0, 'Rate cannot be negative'),
  annualBudget: z.coerce.number().min(0, 'Annual fee must be 0 or higher'),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
})

type AssociationFormData = z.infer<typeof associationSchema>

interface AssociationFormProps {
  onSuccess?: () => void
  initialData?: Partial<AssociationFormData>
}

export function AssociationForm({ onSuccess, initialData }: AssociationFormProps) {
  const t = useTranslations('associations')
  const tCommon = useTranslations('common')
  const tForms = useTranslations('forms')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)
  const [autoAr, setAutoAr] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssociationFormData>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      sellableAreaSquareMeters: 0,
      annualFeePerSquareMeterOmr: 0,
      annualBudget: 0,
      ...initialData,
    },
  })

  const sellableArea = watch('sellableAreaSquareMeters')
  const feePerSqm = watch('annualFeePerSquareMeterOmr')

  useEffect(() => {
    const area = Number(sellableArea)
    const rate = Number(feePerSqm)
    if (!Number.isFinite(area) || !Number.isFinite(rate)) return
    const total = Math.round(area * rate * 1000) / 1000
    setValue('annualBudget', total, { shouldValidate: true })
  }, [sellableArea, feePerSqm, setValue])

  const { translating: nameTranslating } = useEnToArAutofill({
    watch,
    setValue,
    enPath: 'nameEn',
    arPath: 'nameAr',
    options: { enabled: autoAr, minSourceChars: 2, debounceMs: 600 },
  })

  const onSubmit = async (data: AssociationFormData) => {
    setIsLoading(true)
    try {
      // TODO: Save to Firebase
      console.log('Association data:', data)
      toast.success('Association saved successfully')
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
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-0.5 pe-2">
            <Label htmlFor="assoc-auto-ar" className="text-sm font-medium">
              {tForms('autoTranslateAr')}
            </Label>
            {nameTranslating && (
              <p className="text-xs text-muted-foreground">
                {tForms('translating')} <Spinner className="ms-1 inline size-3 align-middle" />
              </p>
            )}
          </div>
          <Switch id="assoc-auto-ar" checked={autoAr} onCheckedChange={setAutoAr} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="nameEn">{tCommon('name')} (English)</FieldLabel>
            <Input
              id="nameEn"
              placeholder="Association name"
              {...register('nameEn')}
              className={errors.nameEn ? 'border-destructive' : ''}
            />
            {errors.nameEn && (
              <p className="text-sm text-destructive">{errors.nameEn.message}</p>
            )}
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="nameAr">{tCommon('name')} (عربي)</FieldLabel>
              {nameTranslating && autoAr && (
                <span className="text-xs text-muted-foreground">{tForms('translating')}</span>
              )}
            </div>
            <Input
              id="nameAr"
              placeholder="اسم الجمعية"
              dir="rtl"
              {...register('nameAr')}
              className={errors.nameAr ? 'border-destructive' : ''}
            />
            {errors.nameAr && (
              <p className="text-sm text-destructive">{errors.nameAr.message}</p>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sellableAreaSquareMeters">{t('sellableArea')}</FieldLabel>
            <Input
              id="sellableAreaSquareMeters"
              type="number"
              min={0.01}
              step="0.01"
              placeholder="0"
              {...register('sellableAreaSquareMeters', { valueAsNumber: true })}
              className={errors.sellableAreaSquareMeters ? 'border-destructive' : ''}
            />
            {errors.sellableAreaSquareMeters && (
              <p className="text-sm text-destructive">{errors.sellableAreaSquareMeters.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="annualFeePerSquareMeterOmr">{t('feePerSqm')}</FieldLabel>
            <Input
              id="annualFeePerSquareMeterOmr"
              type="number"
              min={0}
              step="0.001"
              placeholder="0.000"
              {...register('annualFeePerSquareMeterOmr', { valueAsNumber: true })}
              className={errors.annualFeePerSquareMeterOmr ? 'border-destructive' : ''}
            />
            {errors.annualFeePerSquareMeterOmr && (
              <p className="text-sm text-destructive">{errors.annualFeePerSquareMeterOmr.message}</p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="annualBudget">{t('annualBudget')}</FieldLabel>
          <input type="hidden" {...register('annualBudget', { valueAsNumber: true })} />
          <p
            id="annualBudget"
            className="rounded-md border border-input bg-muted px-3 py-2 text-lg font-semibold tabular-nums"
            aria-live="polite"
          >
            {formatOMR(Number(watch('annualBudget')) || 0)}
          </p>
          <p className="text-xs text-muted-foreground">{t('annualFeeCalculatedHelp')}</p>
          {errors.annualBudget && (
            <p className="text-sm text-destructive">{errors.annualBudget.message}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="contactEmail">{tCommon('email')}</FieldLabel>
            <Input
              id="contactEmail"
              type="email"
              placeholder="association@example.om"
              {...register('contactEmail')}
              className={errors.contactEmail ? 'border-destructive' : ''}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="contactPhone">{tCommon('phone')}</FieldLabel>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+968 9912 3456"
              {...register('contactPhone')}
            />
          </Field>
        </div>
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
