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

const maintenanceSchema = z.object({
  unitId: z.string().min(1, 'Please select a unit'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

// Demo units for selection
const demoUnits = [
  { id: '1', unitNumber: 'A-101', tenantName: 'Ahmed Al-Balushi' },
  { id: '2', unitNumber: 'A-102', tenantName: 'Sara Al-Habsi' },
  { id: '3', unitNumber: 'B-201', tenantName: 'Tech Solutions LLC' },
  { id: '4', unitNumber: 'V-01', tenantName: 'Mohammed Al-Lawati' },
]

interface MaintenanceFormProps {
  onSuccess?: () => void
  initialData?: Partial<MaintenanceFormData>
}

export function MaintenanceForm({ onSuccess, initialData }: MaintenanceFormProps) {
  const t = useTranslations('maintenance')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      priority: 'medium',
      ...initialData,
    },
  })

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsLoading(true)
    try {
      // TODO: Save to Firebase
      console.log('Maintenance request:', { ...data, titleAr: data.title.trim() })
      toast.success('Request submitted successfully')
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
          <FieldLabel htmlFor="unitId">Unit</FieldLabel>
          <Select
            value={watch('unitId')}
            onValueChange={(value) => setValue('unitId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {demoUnits.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.unitNumber} - {unit.tenantName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unitId && (
            <p className="text-sm text-destructive">{errors.unitId.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            placeholder="Brief description of the issue"
            {...register('title')}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="description">{tCommon('description')}</FieldLabel>
          <Textarea
            id="description"
            placeholder="Describe the issue in detail..."
            rows={3}
            {...register('description')}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="priority">Priority</FieldLabel>
          <Select
            value={watch('priority')}
            onValueChange={(value) => setValue('priority', value as MaintenanceFormData['priority'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t('priority.low')}</SelectItem>
              <SelectItem value="medium">{t('priority.medium')}</SelectItem>
              <SelectItem value="high">{t('priority.high')}</SelectItem>
              <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('submit')}
        </Button>
      </div>
    </form>
  )
}
