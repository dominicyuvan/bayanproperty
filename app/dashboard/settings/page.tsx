'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Globe, Shield, Image as ImageIcon, FileStack } from 'lucide-react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { localeNames } from '@/i18n/config'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import { saveUserLanguagePreference, saveUserProfileFields } from '@/lib/user-profile'
import { PROFILE_IMAGE_MAX_BYTES, uploadProfileAvatar } from '@/lib/user-uploads'
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
import { UserVerificationDocuments } from '@/components/settings/user-verification-documents'

const profileSchema = z.object({
  nameEn: z.string().min(2, 'Name must be at least 2 characters'),
  nameAr: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^(\+968)?[0-9]{8}$/, 'Invalid Oman phone number'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const { user, refreshUserProfile } = useAuth()
  const { locale, setLocale } = useLocale()
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isAvatarLoading, setIsAvatarLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const displayName = locale === 'ar' ? user?.nameAr : user?.nameEn
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const showDocuments = user?.role === 'tenant' || user?.role === 'owner'

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!user) return
    const phoneDigits = user.phone?.replace(/^\+968/, '') ?? ''
    profileForm.reset({
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      phone: phoneDigits,
    })
  }, [user?.id, user?.nameEn, user?.nameAr, user?.phone, profileForm.reset])

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast.error(tErrors('unauthorized'))
      return
    }
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }
    setIsProfileLoading(true)
    try {
      await saveUserProfileFields(user.id, {
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        phone: data.phone,
        languagePreference: locale,
      })
      if (auth?.currentUser?.uid === user.id) {
        await updateProfile(auth.currentUser, { displayName: data.nameEn.trim() })
      }
      await refreshUserProfile()
      toast.success(t('profileSaved'))
    } catch (error: unknown) {
      console.error(error)
      const code =
        error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : ''
      if (code === 'permission-denied') toast.error(tErrors('firestorePermissionDenied'))
      else toast.error(tErrors('somethingWentWrong'))
    } finally {
      setIsProfileLoading(false)
    }
  }

  const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }
    setIsAvatarLoading(true)
    try {
      await uploadProfileAvatar(user.id, file, user.avatarStoragePath ?? null)
      await refreshUserProfile()
      toast.success(t('photoUpdated'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'AVATAR_TOO_LARGE') {
        toast.error(tErrors('fileTooLarge', { maxMb: PROFILE_IMAGE_MAX_BYTES / (1024 * 1024) }))
      } else if (msg === 'AVATAR_BAD_TYPE') {
        toast.error(tErrors('invalidFileType'))
      } else {
        console.error(err)
        const code =
          err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
        if (code === 'permission-denied') toast.error(tErrors('firestorePermissionDenied'))
        else toast.error(tErrors('somethingWentWrong'))
      }
    } finally {
      setIsAvatarLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    const fb = auth?.currentUser
    if (!fb?.email) {
      toast.error(tErrors('somethingWentWrong'))
      return
    }
    setIsPasswordLoading(true)
    try {
      const cred = EmailAuthProvider.credential(fb.email, data.currentPassword)
      await reauthenticateWithCredential(fb, cred)
      await updatePassword(fb, data.newPassword)
      toast.success(t('passwordUpdated'))
      passwordForm.reset()
    } catch (err: unknown) {
      console.error(err)
      const code =
        err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error(t('wrongCurrentPassword'))
      } else if (code === 'auth/weak-password') {
        toast.error(tErrors('minLength', { min: 6 }))
      } else {
        toast.error(tErrors('somethingWentWrong'))
      }
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const persistLocale = async (value: 'en' | 'ar') => {
    setLocale(value)
    if (!user || !db) return
    try {
      await saveUserLanguagePreference(user.id, value)
      await refreshUserProfile()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            {t('profile')}
          </TabsTrigger>
          {showDocuments && (
            <TabsTrigger value="documents" className="gap-2">
              <FileStack className="h-4 w-4" />
              {t('documentsTitle')}
            </TabsTrigger>
          )}
          <TabsTrigger value="language" className="gap-2">
            <Globe className="h-4 w-4" />
            {t('language')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            {t('security')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile')}</CardTitle>
              <CardDescription>{t('profileDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={user?.avatarUrl} alt={displayName || ''} />
                      <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isAvatarLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                        <Spinner className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isAvatarLoading || !user}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <ImageIcon className="me-2 h-4 w-4" />
                        {t('changePhoto')}
                      </Button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onAvatarChange}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t('photoHint', { maxMb: 2 })}</p>
                    <div>
                      <p className="font-medium leading-tight">{displayName || '—'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
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
                      {profileForm.formState.errors.nameEn && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.nameEn.message}</p>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="nameAr">{tCommon('name')} (عربي)</FieldLabel>
                      <Input
                        id="nameAr"
                        dir="rtl"
                        {...profileForm.register('nameAr')}
                        className={profileForm.formState.errors.nameAr ? 'border-destructive' : ''}
                      />
                      {profileForm.formState.errors.nameAr && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.nameAr.message}</p>
                      )}
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">{tCommon('email')}</FieldLabel>
                    <Input id="email" type="email" value={user?.email ?? ''} readOnly className="bg-muted" />
                    <p className="text-xs text-muted-foreground">{t('emailReadOnlyHint')}</p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">{tCommon('phone')}</FieldLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="99123456"
                      {...profileForm.register('phone')}
                      className={profileForm.formState.errors.phone ? 'border-destructive' : ''}
                    />
                    {profileForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.phone.message}</p>
                    )}
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

        {showDocuments && user && (
          <TabsContent value="documents" className="mt-6">
            <UserVerificationDocuments userId={user.id} />
          </TabsContent>
        )}

        <TabsContent value="language" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('language')}</CardTitle>
              <CardDescription>{t('languageDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel>{t('language')}</FieldLabel>
                <Select value={locale} onValueChange={(value) => persistLocale(value as 'en' | 'ar')}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{localeNames.en}</SelectItem>
                    <SelectItem value="ar">{localeNames.ar}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-muted-foreground">{t('languageUiHint')}</p>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('security')}</CardTitle>
              <CardDescription>{t('securityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="currentPassword">{t('currentPassword')}</FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      {...passwordForm.register('currentPassword')}
                      className={passwordForm.formState.errors.currentPassword ? 'border-destructive' : ''}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="newPassword">{t('newPassword')}</FieldLabel>
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
                    {t('updatePassword')}
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
