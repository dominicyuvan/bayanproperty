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

const paymentSchema = z.object({
  unitId: z.string().min(1, 'Please select a unit'),
  amount: z.number().min(0.001, 'Amount must be greater than 0'),
  type: z.enum(['rent', 'service_charge', 'deposit', 'utility', 'maintenance', 'other']),
  status: z.enum(['pending', 'paid', 'overdue', 'partial']),
  dueDate: z.string().min(1, 'Due date is required'),
  paidDate: z.string().optional(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

// Demo units for selection
const demoUnits = [
  { id: '1', unitNumber: 'A-101', tenantName: 'Ahmed Al-Balushi' },
  { id: '2', unitNumber: 'A-102', tenantName: 'Sara Al-Habsi' },
  { id: '3', unitNumber: 'B-201', tenantName: 'Tech Solutions LLC' },
  { id: '4', unitNumber: 'V-01', tenantName: 'Mohammed Al-Lawati' },
]

interface PaymentFormProps {
  onSuccess?: () => void
  initialData?: Partial<PaymentFormData>
}

export function PaymentForm({ onSuccess, initialData }: PaymentFormProps) {
  const t = useTranslations('payments')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: 'rent',
      status: 'pending',
      ...initialData,
    },
  })

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true)
    try {
      // TODO: Save to Firebase
      console.log('Payment data:', data)
      toast.success('Payment recorded successfully')
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="amount">{tCommon('amount')} (OMR)</FieldLabel>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.001"
              placeholder="450.000"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="type">{tCommon('type')}</FieldLabel>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as PaymentFormData['type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={tCommon('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">{t('types.rent')}</SelectItem>
                <SelectItem value="service_charge">{t('types.service_charge')}</SelectItem>
                <SelectItem value="deposit">{t('types.deposit')}</SelectItem>
                <SelectItem value="utility">{t('types.utility')}</SelectItem>
                <SelectItem value="maintenance">{t('types.maintenance')}</SelectItem>
                <SelectItem value="other">{t('types.other')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="dueDate">{t('dueDate')}</FieldLabel>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className={errors.dueDate ? 'border-destructive' : ''}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="status">{tCommon('status')}</FieldLabel>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as PaymentFormData['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="paid">{t('status.paid')}</SelectItem>
                <SelectItem value="overdue">{t('status.overdue')}</SelectItem>
                <SelectItem value="partial">{t('status.partial')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {watch('status') === 'paid' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="paidDate">{t('paidDate')}</FieldLabel>
              <Input
                id="paidDate"
                type="date"
                {...register('paidDate')}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="method">{t('paymentMethod')}</FieldLabel>
              <Select
                value={watch('method') || ''}
                onValueChange={(value) => setValue('method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('paymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="reference">{t('reference')}</FieldLabel>
          <Input
            id="reference"
            placeholder="TRX-2024-001"
            {...register('reference')}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">{tCommon('notes')}</FieldLabel>
          <Textarea
            id="notes"
            placeholder="Optional notes..."
            rows={2}
            {...register('notes')}
          />
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
