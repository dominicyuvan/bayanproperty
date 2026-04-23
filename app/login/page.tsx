'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Eye, EyeOff, Globe, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { localeNames } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const { signIn, isConfigured, user, initialized, loading } = useAuth()
  const { locale, setLocale } = useLocale()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (initialized && !loading && user) {
      router.replace('/dashboard')
    }
  }, [initialized, loading, user, router])

  const onSubmit = async (data: LoginFormData) => {
    if (!isConfigured) {
      toast.error('Firebase is not configured. Please add your Firebase credentials.')
      return
    }
    
    setIsLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success(locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully')
      router.replace('/dashboard')
    } catch (error) {
      if (error instanceof FirebaseError) {
        const messageByCode: Record<string, string> = {
          'auth/invalid-credential': 'Invalid email or password.',
          'auth/user-not-found': 'No account found for this email.',
          'auth/wrong-password': 'Invalid email or password.',
          'auth/too-many-requests': 'Too many attempts. Please try again later.',
          'auth/network-request-failed': 'Network error. Check your connection and try again.',
          'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Auth.',
        }

        toast.error(messageByCode[error.code] || error.message || tErrors('somethingWentWrong'))
      } else {
        toast.error(tErrors('somethingWentWrong'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      {/* Language Switcher */}
      <div className="absolute end-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocale('en')}>
              {localeNames.en}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocale('ar')}>
              {localeNames.ar}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
          <CardDescription>{t('signInDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <Alert className="mb-4 border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Firebase Setup Required</AlertTitle>
              <AlertDescription className="text-sm">
                Add your Firebase credentials in the Vars section (Settings menu, top right) to enable authentication.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">{t('email')}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{tErrors('invalidEmail')}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    {...register('password')}
                    className={errors.password ? 'border-destructive pe-10' : 'pe-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{tErrors('minLength', { min: 6 })}</p>
                )}
              </Field>
            </FieldGroup>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="me-2" /> : null}
              {t('signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('noAccount')}</span>{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t('signUp')}
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {tCommon('appName')}
      </p>
    </div>
  )
}
