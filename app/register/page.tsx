'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

const registerSchema = z.object({
  nameEn: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^(\+968)?[0-9]{8}$/, 'Invalid Oman phone number'),
  password: z.string().min(6),
  confirmPassword: z.string(),
  role: z.enum(['tenant', 'owner', 'property_manager']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'tenant',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const name = data.nameEn.trim()
      await signUp(data.email, data.password, {
        nameEn: name,
        nameAr: name,
        phone: data.phone.startsWith('+968') ? data.phone : `+968${data.phone}`,
        role: data.role,
        languagePreference: 'en',
      })
      toast.success('Account created successfully')
      router.push('/dashboard')
    } catch (error) {
      toast.error(tErrors('somethingWentWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t('createAccount')}</CardTitle>
          <CardDescription>{t('signUpDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nameEn">Full name</FieldLabel>
                <Input
                  id="nameEn"
                  placeholder="John Doe"
                  {...register('nameEn')}
                  className={errors.nameEn ? 'border-destructive' : ''}
                />
                {errors.nameEn && (
                  <p className="text-sm text-destructive">{errors.nameEn.message}</p>
                )}
              </Field>

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
                <FieldLabel htmlFor="phone">{tCommon('phone')} (+968)</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9XXXXXXX"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{tErrors('invalidPhone')}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  value={watch('role')}
                  onValueChange={(value) => setValue('role', value as 'tenant' | 'owner' | 'property_manager')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="property_manager">Property manager</SelectItem>
                  </SelectContent>
                </Select>
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

              <Field>
                <FieldLabel htmlFor="confirmPassword">{t('confirmPassword')}</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{tErrors('passwordMismatch')}</p>
                )}
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="me-2" /> : null}
              {t('signUp')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('hasAccount')}</span>{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('signIn')}
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
