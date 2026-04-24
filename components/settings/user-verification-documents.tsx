'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FileText, Trash2, Upload, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { deleteUserUpload, subscribeUserUploads, uploadKycDocument } from '@/lib/user-uploads'
import type { UserUploadCategory, UserUploadRecord } from '@/lib/types'

const CATEGORIES: UserUploadCategory[] = [
  'national_id',
  'residence_visa',
  'passport',
  'cr_certificate',
  'lease_agreement',
  'proof_of_address',
  'other',
]

interface UserVerificationDocumentsProps {
  userId: string
}

export function UserVerificationDocuments({ userId }: UserVerificationDocumentsProps) {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [uploads, setUploads] = useState<UserUploadRecord[]>([])
  const [category, setCategory] = useState<UserUploadCategory>('national_id')
  const [uploading, setUploading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<UserUploadRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = subscribeUserUploads(
      userId,
      (rows) => setUploads(rows),
      () => toast.error(tErrors('somethingWentWrong')),
    )
    return () => unsub()
  }, [userId, tErrors])

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await uploadKycDocument(userId, category, file)
      toast.success(t('documentUploaded'))
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'DOC_TOO_LARGE') {
        toast.error(tErrors('fileTooLarge', { maxMb: 10 }))
      } else if (code === 'DOC_BAD_TYPE') {
        toast.error(tErrors('invalidFileType'))
      } else {
        console.error(err)
        const c =
          err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
        if (c === 'permission-denied') toast.error(tErrors('firestorePermissionDenied'))
        else toast.error(tErrors('somethingWentWrong'))
      }
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteUserUpload(userId, pendingDelete)
      toast.success(t('documentRemoved'))
      setPendingDelete(null)
    } catch (err) {
      console.error(err)
      toast.error(tErrors('somethingWentWrong'))
    } finally {
      setDeleting(false)
    }
  }

  const formatKb = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('documentsTitle')}
          </CardTitle>
          <CardDescription>{t('documentsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium">{t('documentCategory')}</p>
              <Select value={category} onValueChange={(v) => setCategory(v as UserUploadCategory)}>
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`docCategory.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={onPickFile}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Spinner size="sm" className="me-2" /> : <Upload className="me-2 h-4 w-4" />}
                {t('uploadDocument')}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('documentsAcceptHint')}</p>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('documentCategory')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('fileName')}</TableHead>
                  <TableHead className="text-end">{t('fileSize')}</TableHead>
                  <TableHead className="hidden md:table-cell">{tCommon('date')}</TableHead>
                  <TableHead className="w-24 text-end">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{t(`docCategory.${u.category}`)}</TableCell>
                    <TableCell className="hidden max-w-[12rem] truncate sm:table-cell">
                      {u.originalFileName}
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground tabular-nums text-sm">
                      {formatKb(u.sizeBytes)}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground tabular-nums md:table-cell">
                      {u.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={u.downloadUrl} target="_blank" rel="noopener noreferrer" title={t('openFile')}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setPendingDelete(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {uploads.length === 0 && (
              <p className="border-t px-3 py-8 text-center text-sm text-muted-foreground">{t('noDocumentsYet')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDocumentTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDocumentDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tCommon('cancel')}</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Spinner size="sm" className="me-2" /> : null}
              {tCommon('delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
