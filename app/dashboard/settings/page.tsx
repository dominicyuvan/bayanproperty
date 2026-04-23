'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Globe, Bell, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { localeNames } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

const profileSchema = z.object({
  nameEn: z.string().min(2, 'Name must be at least 2 characters'),
  nameAr: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^(\+968)?[0-9]{8}$/, 'Invalid Oman phone number'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const { user } = useAuth()
  const { locale, setLocale } = useLocale()
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const displayName = locale === 'ar' ? user?.nameAr : user?.nameEn
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nameEn: user?.nameEn || '',
      nameAr: user?.nameAr || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsProfileLoading(true)
    try {
      // TODO: Update profile in Firebase
      console.log('Profile data:', data)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(tErrors('somethingWentWrong'))
    } finally {
      setIsProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true)
    try {
      // TODO: Update password in Firebase
      console.log('Password update:', data)
      toast.success('Password updated successfully')
      passwordForm.reset()
    } catch (error) {
      toast.error(tErrors('somethingWentWrong'))
    } finally {
      setIsPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            {t('profile')}
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Globe className="h-4 w-4" />
            {t('language')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            {t('security')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile')}</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{displayName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="nameEn">{tCommon('name')} (English)</FieldLabel>
                      <Input
                        id="nameEn"
                        {...profileForm.register('nameEn')}
                        className={profileForm.formState.errors.nameEn ? 'border-destructive' : ''}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="nameAr">{tCommon('name')} (عربي)</FieldLabel>
                      <Input
                        id="nameAr"
                        dir="rtl"
                        {...profileForm.register('nameAr')}
                        className={profileForm.formState.errors.nameAr ? 'border-destructive' : ''}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">{tCommon('email')}</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      className={profileForm.formState.errors.email ? 'border-destructive' : ''}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">{tCommon('phone')}</FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+968 9XXX XXXX"
                      {...profileForm.register('phone')}
                      className={profileForm.formState.errors.phone ? 'border-destructive' : ''}
                    />
                  </Field>
                </FieldGroup>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isProfileLoading}>
                    {isProfileLoading ? <Spinner size="sm" className="me-2" /> : null}
                    {tCommon('save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('language')}</CardTitle>
              <CardDescription>
                Choose your preferred language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel>{t('language')}</FieldLabel>
                <Select value={locale} onValueChange={(value) => setLocale(value as 'en' | 'ar')}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{localeNames.en}</SelectItem>
                    <SelectItem value="ar">{localeNames.ar}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This will change the language and text direction of the interface.
                </p>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('security')}</CardTitle>
              <CardDescription>
                Update your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register('currentPassword')}
                      className={passwordForm.formState.errors.currentPassword ? 'border-destructive' : ''}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register('newPassword')}
                      className={passwordForm.formState.errors.newPassword ? 'border-destructive' : ''}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{tErrors('minLength', { min: 6 })}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">{tAuth('confirmPassword')}</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                      className={passwordForm.formState.errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{tErrors('passwordMismatch')}</p>
                    )}
                  </Field>
                </FieldGroup>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPasswordLoading}>
                    {isPasswordLoading ? <Spinner size="sm" className="me-2" /> : null}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
