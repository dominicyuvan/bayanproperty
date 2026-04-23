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
import { Spinner } from '@/components/ui/spinner'

const associationSchema = z.object({
  nameEn: z.string().min(2, 'Name must be at least 2 characters'),
  nameAr: z.string().min(2, 'Name must be at least 2 characters'),
  annualBudget: z.number().min(0, 'Budget must be 0 or higher'),
  meetingSchedule: z.string().optional(),
  meetingScheduleAr: z.string().optional(),
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
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssociationFormData>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      annualBudget: 0,
      ...initialData,
    },
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
            <FieldLabel htmlFor="nameAr">{tCommon('name')} (عربي)</FieldLabel>
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

        <Field>
          <FieldLabel htmlFor="annualBudget">{t('annualBudget')} (OMR)</FieldLabel>
          <Input
            id="annualBudget"
            type="number"
            min={0}
            step="0.001"
            placeholder="25000.000"
            {...register('annualBudget', { valueAsNumber: true })}
            className={errors.annualBudget ? 'border-destructive' : ''}
          />
          {errors.annualBudget && (
            <p className="text-sm text-destructive">{errors.annualBudget.message}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="meetingSchedule">{t('meetingSchedule')} (English)</FieldLabel>
            <Input
              id="meetingSchedule"
              placeholder="First Saturday of each month"
              {...register('meetingSchedule')}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="meetingScheduleAr">{t('meetingSchedule')} (عربي)</FieldLabel>
            <Input
              id="meetingScheduleAr"
              placeholder="السبت الأول من كل شهر"
              dir="rtl"
              {...register('meetingScheduleAr')}
            />
          </Field>
        </div>

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
