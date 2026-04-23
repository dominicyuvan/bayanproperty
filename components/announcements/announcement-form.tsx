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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  type: z.enum(['general', 'urgent', 'maintenance', 'payment_reminder', 'association']),
  targetAudience: z.enum(['all', 'tenants', 'owners', 'association_members']),
  priority: z.enum(['normal', 'high', 'urgent']),
  sendEmail: z.boolean(),
  sendSms: z.boolean(),
  expiryDate: z.string().optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface AnnouncementFormProps {
  onSuccess?: () => void
  initialData?: Partial<AnnouncementFormData>
}

export function AnnouncementForm({ onSuccess, initialData }: AnnouncementFormProps) {
  const t = useTranslations('announcements')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: 'general',
      targetAudience: 'all',
      priority: 'normal',
      sendEmail: true,
      sendSms: false,
      ...initialData,
    },
  })

  const onSubmit = async (data: AnnouncementFormData) => {
    setIsLoading(true)
    try {
      const title = data.title.trim()
      const content = data.content.trim()
      // TODO: Save to Firebase and send notifications
      console.log('Announcement data:', { ...data, titleAr: title, contentAr: content })
      toast.success('Announcement published successfully')
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
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            placeholder="Announcement title"
            {...register('title')}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="content">{t('content')}</FieldLabel>
          <Textarea
            id="content"
            placeholder="Write your announcement content..."
            rows={4}
            {...register('content')}
            className={errors.content ? 'border-destructive' : ''}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="type">{tCommon('type')}</FieldLabel>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as AnnouncementFormData['type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={tCommon('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t('types.general')}</SelectItem>
                <SelectItem value="urgent">{t('types.urgent')}</SelectItem>
                <SelectItem value="maintenance">{t('types.maintenance')}</SelectItem>
                <SelectItem value="payment_reminder">{t('types.payment_reminder')}</SelectItem>
                <SelectItem value="association">{t('types.association')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="targetAudience">{t('targetAudience')}</FieldLabel>
            <Select
              value={watch('targetAudience')}
              onValueChange={(value) => setValue('targetAudience', value as AnnouncementFormData['targetAudience'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('targetAudience')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('targets.all')}</SelectItem>
                <SelectItem value="tenants">{t('targets.tenants')}</SelectItem>
                <SelectItem value="owners">{t('targets.owners')}</SelectItem>
                <SelectItem value="association_members">{t('targets.association_members')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="priority">Priority</FieldLabel>
            <Select
              value={watch('priority')}
              onValueChange={(value) => setValue('priority', value as AnnouncementFormData['priority'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('priority.normal')}</SelectItem>
                <SelectItem value="high">{t('priority.high')}</SelectItem>
                <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="expiryDate">{t('expiryDate')} (Optional)</FieldLabel>
          <Input id="expiryDate" type="date" {...register('expiryDate')} />
        </Field>

        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium">{t('sendNotifications')}</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch('sendEmail')}
                onCheckedChange={(checked) => setValue('sendEmail', !!checked)}
              />
              Email notifications
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch('sendSms')}
                onCheckedChange={(checked) => setValue('sendSms', !!checked)}
              />
              SMS notifications
            </label>
          </div>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="me-2" /> : null}
          Publish
        </Button>
      </div>
    </form>
  )
}
