'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { PartyDocumentUpload } from '@/components/party/party-document-upload'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { createOwnerRecord, patchOwnerRecord, type CreateOwnerInput } from '@/lib/owners-db'
import { assertRosterPartyKyc5mb, uploadRosterPartyKyc5mb } from '@/lib/roster-documents'
import { getExpiryUrgency } from '@/lib/expiry-urgency'
import { individualIdTypeToUploadCategory } from '@/lib/oman-party-categories'
import { OMAN_NATIONALITY_OPTIONS } from '@/lib/oman-nationalities'
import type { IndividualIdTypeOman, PartyType } from '@/lib/types'

type OwnerFormData = {
  partyType: PartyType
  nameEn: string
  nameAr: string
  nationality: string
  individualIdType: IndividualIdTypeOman
  idNumber: string
  idExpiryDate: string
  email: string
  phone: string
  contactPersonName: string
  contactPersonPhone: string
  crNumber: string
  crExpiryDate: string
  propertyCount: number
  unitCount: number
  iban: string
}

interface OwnerFormProps {
  onSuccess?: () => void
}

function normalizeOmanPhone(phone: string): string {
  const digits = phone.replace(/\s/g, '')
  if (digits.startsWith('+968')) return digits
  if (digits.startsWith('968')) return `+${digits}`
  return `+968${digits}`
}

function parseYmdToDate(s: string): Date | undefined {
  if (!s?.trim()) return undefined
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const PHONE_OM = /^(\+968)?[0-9]{8}$/

const ibanLoose = (s: string) => {
  const x = s.replace(/\s/g, '')
  if (!x) return true
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,32}$/i.test(x)
}

export function OwnerForm({ onSuccess }: OwnerFormProps) {
  const t = useTranslations('owners')
  const tParty = useTranslations('party')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [crFile, setCrFile] = useState<File | null>(null)
  const [crPreview, setCrPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState('')

  const schema = useMemo(
    () =>
      z
        .object({
          partyType: z.enum(['individual', 'company']),
          nameEn: z.string().min(2, tErrors('minLength', { min: 2 })),
          nameAr: z.string().min(2, tErrors('minLength', { min: 2 })),
          nationality: z.string(),
          individualIdType: z.enum(['national_id', 'residency', 'passport']),
          idNumber: z.string(),
          idExpiryDate: z.string(),
          email: z.string().email(tErrors('invalidEmail')),
          phone: z.string(),
          contactPersonName: z.string(),
          contactPersonPhone: z.string(),
          crNumber: z.string(),
          crExpiryDate: z.string(),
          propertyCount: z.coerce.number().int().min(0),
          unitCount: z.coerce.number().int().min(0),
          iban: z.string(),
        })
        .superRefine((data, ctx) => {
          const ib = data.iban.replace(/\s/g, '')
          if (ib && !ibanLoose(data.iban)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['iban'], message: tParty('ibanInvalid') })
          }
          if (data.partyType === 'company') {
            if (!/^\d+$/.test(data.crNumber.trim()) || data.crNumber.trim().length < 3) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['crNumber'], message: tParty('crRequired') })
            }
            if (!data.crExpiryDate?.trim()) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['crExpiryDate'], message: tParty('crExpiryRequired') })
            }
            if (data.contactPersonName.trim().length < 2) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contactPersonName'], message: tParty('contactRequired') })
            }
            if (!PHONE_OM.test(data.contactPersonPhone.replace(/\s/g, ''))) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contactPersonPhone'], message: tErrors('invalidPhone') })
            }
            return
          }
          // individual
          if (!data.idNumber?.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idNumber'], message: tParty('idNumberRequired') })
            return
          }
          const idn = data.idNumber.trim()
          if (data.individualIdType === 'national_id') {
            if (!/^\d{8}$/.test(idn)) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idNumber'], message: tParty('nationalIdDigits') })
            }
          } else if (data.individualIdType === 'residency') {
            if (!/^\d{8}$/.test(idn)) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idNumber'], message: tParty('residencyDigits') })
            }
            if (!data.idExpiryDate?.trim()) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idExpiryDate'], message: tParty('idExpiryRequired') })
            }
          } else {
            if (!/^[A-Za-z0-9-]{4,20}$/.test(idn)) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idNumber'], message: tParty('passportFormat') })
            }
            if (!data.idExpiryDate?.trim()) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['idExpiryDate'], message: tParty('idExpiryRequired') })
            }
          }
          if (!PHONE_OM.test(data.phone.replace(/\s/g, ''))) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: tErrors('invalidPhone') })
          }
        }),
    [tErrors, tParty],
  )

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      partyType: 'individual',
      nameEn: '',
      nameAr: '',
      nationality: 'OM',
      individualIdType: 'national_id',
      idNumber: '',
      idExpiryDate: '',
      email: '',
      phone: '',
      contactPersonName: '',
      contactPersonPhone: '',
      crNumber: '',
      crExpiryDate: '',
      propertyCount: 0,
      unitCount: 0,
      iban: '',
    },
  })

  const partyType = useWatch({ control, name: 'partyType' })
  const individualIdType = useWatch({ control, name: 'individualIdType' })
  const idExpiryDateW = useWatch({ control, name: 'idExpiryDate' })
  const crExpiryDateW = useWatch({ control, name: 'crExpiryDate' })
  const revId = useRef<string | null>(null)
  const revCr = useRef<string | null>(null)

  useEffect(() => {
    if (revId.current) {
      URL.revokeObjectURL(revId.current)
      revId.current = null
    }
    if (idFile && idFile.type.startsWith('image/')) {
      const u = URL.createObjectURL(idFile)
      revId.current = u
      setIdPreview(u)
    } else {
      setIdPreview(null)
    }
  }, [idFile])

  useEffect(() => {
    if (revCr.current) {
      URL.revokeObjectURL(revCr.current)
      revCr.current = null
    }
    if (crFile && crFile.type.startsWith('image/')) {
      const u = URL.createObjectURL(crFile)
      revCr.current = u
      setCrPreview(u)
    } else {
      setCrPreview(null)
    }
  }, [crFile])

  const idExpU = getExpiryUrgency(parseYmdToDate(idExpiryDateW))
  const crExpU = getExpiryUrgency(parseYmdToDate(crExpiryDateW))

  const nationalityLabel = (code: (typeof OMAN_NATIONALITY_OPTIONS)[number]['value']) => {
    const m = {
      OM: tParty('nationalities.oman'),
      AE: tParty('nationalities.uae'),
      IN: tParty('nationalities.india'),
      PK: tParty('nationalities.pakistan'),
      BD: tParty('nationalities.bangladesh'),
      EG: tParty('nationalities.egypt'),
      PH: tParty('nationalities.philippines'),
      LK: tParty('nationalities.sriLanka'),
      GB: tParty('nationalities.uk'),
      US: tParty('nationalities.us'),
      OTHER: tParty('nationalities.other'),
    } as const
    return m[code as keyof typeof m] ?? code
  }

  const onSubmit = async (data: OwnerFormData) => {
    if (!isFirebaseConfigured || !db) {
      toast.error(tErrors('databaseUnavailable'))
      return
    }
    setFileError('')
    try {
      if (idFile) assertRosterPartyKyc5mb(idFile)
      if (crFile) assertRosterPartyKyc5mb(crFile)
    } catch {
      setFileError(tErrors('fileTooLarge', { maxMb: 5 }))
      return
    }

    const ibanT = data.iban.trim() || undefined
    const idExp = parseYmdToDate(data.idExpiryDate)
    const crExp = parseYmdToDate(data.crExpiryDate)

    const base: CreateOwnerInput = {
      partyType: data.partyType,
      nameEn: data.nameEn.trim(),
      nameAr: data.nameAr.trim(),
      email: data.email,
      propertyCount: data.propertyCount,
      unitCount: data.unitCount,
      phone:
        data.partyType === 'company'
          ? normalizeOmanPhone(data.contactPersonPhone)
          : normalizeOmanPhone(data.phone),
      iban: ibanT,
    }

    if (data.partyType === 'individual') {
      base.nationality = data.nationality
      base.individualIdType = data.individualIdType
      base.idNumber = data.idNumber.trim()
      if (idExp) base.idExpiryDate = idExp
    } else {
      base.crNumber = data.crNumber.trim()
      if (crExp) base.crExpiryDate = crExp
      base.contactPersonName = data.contactPersonName.trim()
      base.contactPersonPhone = normalizeOmanPhone(data.contactPersonPhone)
    }

    try {
      const id = await createOwnerRecord(base)
      if (data.partyType === 'individual' && idFile) {
        const cat = individualIdTypeToUploadCategory(data.individualIdType)
        const { downloadUrl, storagePath, originalFileName } = await uploadRosterPartyKyc5mb(
          'owners',
          id,
          cat,
          idFile,
        )
        await patchOwnerRecord(id, {
          idDocumentUrl: downloadUrl,
          idDocumentStoragePath: storagePath,
          idDocumentFileName: originalFileName,
        })
      } else if (data.partyType === 'company' && crFile) {
        const { downloadUrl, storagePath, originalFileName } = await uploadRosterPartyKyc5mb(
          'owners',
          id,
          'cr_certificate',
          crFile,
        )
        await patchOwnerRecord(id, {
          crCertificateUrl: downloadUrl,
          crCertificateStoragePath: storagePath,
          crCertificateFileName: originalFileName,
        })
      }
      toast.success(t('ownerSaved'))
      onSuccess?.()
    } catch (error: unknown) {
      console.error(error)
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : ''
      if (code === 'permission-denied') {
        toast.error(tErrors('firestorePermissionDenied'))
      } else {
        toast.error(tErrors('somethingWentWrong'))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium leading-none">{tParty('registerAs')}</p>
          <p className="text-xs text-muted-foreground">{tParty('registerAsHelp')}</p>
        </div>
        <ToggleGroup
          type="single"
          value={partyType}
          onValueChange={(v) => {
            if (v === 'individual' || v === 'company') {
              setValue('partyType', v, { shouldValidate: true })
              setIdFile(null)
              setCrFile(null)
            }
          }}
          variant="outline"
          className="w-full justify-stretch sm:w-auto"
        >
          <ToggleGroupItem value="individual" className="flex-1 sm:flex-initial" aria-label="individual">
            {tParty('individual')}
          </ToggleGroupItem>
          <ToggleGroupItem value="company" className="flex-1 sm:flex-initial" aria-label="company">
            {tParty('company')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <FieldGroup>
        {partyType === 'individual' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="o-nameEn">{tParty('fullNameEn')}</FieldLabel>
                <Input id="o-nameEn" {...register('nameEn')} className={errors.nameEn ? 'border-destructive' : ''} />
                {errors.nameEn && <p className="text-sm text-destructive">{errors.nameEn.message}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="o-nameAr">{tParty('fullNameAr')}</FieldLabel>
                <Input id="o-nameAr" dir="rtl" {...register('nameAr')} className={errors.nameAr ? 'border-destructive' : ''} />
                {errors.nameAr && <p className="text-sm text-destructive">{errors.nameAr.message}</p>}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="o-nat">{tParty('nationality')}</FieldLabel>
              <Select
                value={watch('nationality') || 'OM'}
                onValueChange={(v) => setValue('nationality', v, { shouldValidate: true })}
              >
                <SelectTrigger id="o-nat" className="w-full sm:max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OMAN_NATIONALITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {nationalityLabel(o.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">{tParty('idType')}</p>
              <RadioGroup
                value={watch('individualIdType')}
                onValueChange={(v) =>
                  setValue('individualIdType', v as IndividualIdTypeOman, { shouldValidate: true })
                }
                className="flex flex-wrap gap-4"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="national_id" id="id-nat" />
                  <span>{tParty('idNational')}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="residency" id="id-res" />
                  <span>{tParty('idResidency')}</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="passport" id="id-pass" />
                  <span>{tParty('idPassport')}</span>
                </label>
              </RadioGroup>
            </div>
            <Field>
              <FieldLabel htmlFor="o-idn">{tParty('idNumber')}</FieldLabel>
              <Input
                id="o-idn"
                autoComplete="off"
                {...register('idNumber')}
                className={errors.idNumber ? 'border-destructive' : ''}
              />
              {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber.message}</p>}
            </Field>
            {(individualIdType === 'residency' || individualIdType === 'passport') && (
              <Field>
                <FieldLabel htmlFor="o-idex">{tParty('idExpiry')}</FieldLabel>
                <Input id="o-idex" type="date" {...register('idExpiryDate')} className={errors.idExpiryDate ? 'border-destructive' : 'sm:max-w-xs'} />
                {errors.idExpiryDate && <p className="text-sm text-destructive">{errors.idExpiryDate.message}</p>}
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="o-em">{tCommon('email')}</FieldLabel>
                <Input
                  id="o-em"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="o-ph">{tCommon('phone')} (+968)</FieldLabel>
                <Input id="o-ph" placeholder="99123456" {...register('phone')} className={errors.phone ? 'border-destructive' : ''} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </Field>
            </div>
            <PartyDocumentUpload
              label={tParty('uploadIdDocument')}
              emptyHint={tParty('uploadIdHint')}
              file={idFile}
              previewObjectUrl={idPreview}
              onFileSelect={setIdFile}
              expiryUrgency={idExpU}
            />
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="oc-ne">{tParty('companyNameEn')}</FieldLabel>
                <Input id="oc-ne" {...register('nameEn')} className={errors.nameEn ? 'border-destructive' : ''} />
                {errors.nameEn && <p className="text-sm text-destructive">{errors.nameEn.message}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="oc-na">{tParty('companyNameAr')}</FieldLabel>
                <Input id="oc-na" dir="rtl" {...register('nameAr')} className={errors.nameAr ? 'border-destructive' : ''} />
                {errors.nameAr && <p className="text-sm text-destructive">{errors.nameAr.message}</p>}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="oc-cr">{tParty('crNumber')}</FieldLabel>
                <Input
                  id="oc-cr"
                  inputMode="numeric"
                  {...register('crNumber')}
                  className={errors.crNumber ? 'border-destructive' : ''}
                />
                {errors.crNumber && <p className="text-sm text-destructive">{errors.crNumber.message}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="oc-crex">{tParty('crExpiry')}</FieldLabel>
                <Input id="oc-crex" type="date" {...register('crExpiryDate')} className={errors.crExpiryDate ? 'border-destructive' : 'sm:max-w-xs'} />
                {errors.crExpiryDate && <p className="text-sm text-destructive">{errors.crExpiryDate.message}</p>}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="oc-cn">{tParty('contactPersonName')}</FieldLabel>
                <Input
                  id="oc-cn"
                  {...register('contactPersonName')}
                  className={errors.contactPersonName ? 'border-destructive' : ''}
                />
                {errors.contactPersonName && <p className="text-sm text-destructive">{errors.contactPersonName.message}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="oc-cp">{tParty('contactPersonPhone')} (+968)</FieldLabel>
                <Input
                  id="oc-cp"
                  placeholder="99123456"
                  {...register('contactPersonPhone')}
                  className={errors.contactPersonPhone ? 'border-destructive' : ''}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="oc-em">{tCommon('email')}</FieldLabel>
              <Input
                id="oc-em"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </Field>
            <PartyDocumentUpload
              label={tParty('uploadCrCertificate')}
              emptyHint={tParty('uploadCrHint')}
              file={crFile}
              previewObjectUrl={crPreview}
              onFileSelect={setCrFile}
              expiryUrgency={crExpU}
            />
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="o-pc">{t('propertyCount')}</FieldLabel>
            <Input
              id="o-pc"
              type="number"
              min={0}
              step={1}
              {...register('propertyCount', { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="o-uc">{t('unitCount')}</FieldLabel>
            <Input
              id="o-uc"
              type="number"
              min={0}
              step={1}
              {...register('unitCount', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="o-iban">{tParty('ibanOptional')}</FieldLabel>
          <Input
            id="o-iban"
            autoComplete="off"
            placeholder="OM…"
            {...register('iban')}
            className={errors.iban ? 'border-destructive' : ''}
          />
          {errors.iban && <p className="text-sm text-destructive">{errors.iban.message}</p>}
        </Field>
        {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" className="me-2" /> : null}
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
