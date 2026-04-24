'use client'

import { useId, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ROSTER_PARTY_KYC_MAX_BYTES } from '@/lib/roster-documents'
import type { ExpiryUrgency } from '@/lib/expiry-urgency'

type PartyDocumentUploadProps = {
  label: string
  emptyHint: string
  file: File | null
  /** For image preview */
  previewObjectUrl: string | null
  onFileSelect: (file: File | null) => void
  /** Expiry urgency for the related document (ID or CR) */
  expiryUrgency?: ExpiryUrgency
  errorMessage?: string
}

export function PartyDocumentUpload({
  label,
  emptyHint,
  file,
  previewObjectUrl,
  onFileSelect,
  expiryUrgency,
  errorMessage,
}: PartyDocumentUploadProps) {
  const t = useTranslations('party')
  const inputId = useId()
  const ref = useRef<HTMLInputElement>(null)
  const showWarning = expiryUrgency === 'warning'
  const showExpired = expiryUrgency === 'expired'

  return (
    <Field>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {showExpired ? (
          <Badge variant="destructive" className="text-xs">
            {t('expiryExpired')}
          </Badge>
        ) : showWarning ? (
          <Badge variant="outline" className="border-amber-500/60 text-amber-800 dark:text-amber-200 text-xs">
            {t('expirySoon')}
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{emptyHint}</p>
      <div
        className={cn(
          'mt-2 flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-start',
          errorMessage && 'border-destructive',
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            e.target.value = ''
            onFileSelect(f)
          }}
        />
        {!file && !previewObjectUrl ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.click()}>
            {t('chooseFile')}
          </Button>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
              {previewObjectUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewObjectUrl} alt="" className="h-full w-full object-cover" />
              ) : file?.type === 'application/pdf' ? (
                <FileText className="h-8 w-8 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file?.name ?? '—'}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => ref.current?.click()}>
                  {t('replaceFile')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onFileSelect(null)}
                >
                  <X className="me-1 h-3.5 w-3.5" />
                  {t('removeFile')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t('fileRules', { maxMb: ROSTER_PARTY_KYC_MAX_BYTES / (1024 * 1024) })}
      </p>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </Field>
  )
}
