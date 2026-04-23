'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus,
  Search,
  UserCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building2,
  Home,
  FileStack,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { OwnerForm } from '@/components/owners/owner-form'
import { RosterDocumentsPanel } from '@/components/roster/roster-documents-panel'
import { subscribeOwnerRecords } from '@/lib/owners-db'
import type { OwnerRecord } from '@/lib/types'

export default function OwnersPage() {
  const t = useTranslations('owners')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [owners, setOwners] = useState<OwnerRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [ownerFormKey, setOwnerFormKey] = useState(0)
  const [documentsOwnerId, setDocumentsOwnerId] = useState<string | null>(null)
  const listErrorShown = useRef(false)

  useEffect(() => {
    listErrorShown.current = false
    const unsubscribe = subscribeOwnerRecords(
      (rows) => setOwners(rows),
      (err) => {
        console.error(err)
        if (!listErrorShown.current) {
          listErrorShown.current = true
          const code =
            err && typeof err === 'object' && 'code' in err
              ? String((err as { code: string }).code)
              : ''
          if (code === 'permission-denied') {
            toast.error(tErrors('firestorePermissionDenied'))
          } else {
            toast.error(tErrors('somethingWentWrong'))
          }
        }
      },
    )
    return () => unsubscribe()
  }, [tErrors])

  const filtered = owners.filter((row) => {
    const name = row.nameEn.toLowerCase()
    const q = searchQuery.toLowerCase()
    return (
      name.includes(q) ||
      row.nameAr.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      String(row.propertyCount).includes(q) ||
      String(row.unitCount).includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {owners.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) setOwnerFormKey((k) => k + 1)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addOwner')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addOwner')}</DialogTitle>
              <DialogDescription>{t('addOwnerDescription')}</DialogDescription>
            </DialogHeader>
            <OwnerForm key={ownerFormKey} onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={documentsOwnerId !== null} onOpenChange={(open) => !open && setDocumentsOwnerId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('documentsDialogTitle')}</DialogTitle>
            <DialogDescription>{t('documentsDialogDescription')}</DialogDescription>
          </DialogHeader>
          {documentsOwnerId ? (
            <RosterDocumentsPanel entity="owners" entityId={documentsOwnerId} />
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tCommon('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[10rem] max-w-[14rem]">{tCommon('name')}</TableHead>
              <TableHead className="hidden md:table-cell max-w-[14rem]">{tCommon('email')}</TableHead>
              <TableHead className="hidden lg:table-cell w-[9rem]">{tCommon('phone')}</TableHead>
              <TableHead className="text-center tabular-nums">
                <span className="inline-flex items-center justify-center gap-1">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {t('propertyCount')}
                </span>
              </TableHead>
              <TableHead className="text-center tabular-nums">
                <span className="inline-flex items-center justify-center gap-1">
                  <Home className="h-3.5 w-3.5 shrink-0" />
                  {t('unitCount')}
                </span>
              </TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const name = row.nameEn

              return (
                <TableRow key={row.id}>
                  <TableCell className="min-w-0 max-w-[14rem]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-0 max-w-[14rem]">
                    <span className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{row.email}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{row.phone}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{row.propertyCount}</TableCell>
                  <TableCell className="text-center tabular-nums">{row.unitCount}</TableCell>
                  <TableCell className="w-12 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDocumentsOwnerId(row.id)}>
                          <FileStack className="me-2 h-4 w-4" />
                          {t('openDocuments')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="me-2 h-4 w-4" />
                          {tCommon('view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="me-2 h-4 w-4" />
                          {tCommon('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="me-2 h-4 w-4" />
                          {tCommon('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center border-t py-12 text-center">
            <UserCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No owners found</h3>
            <p className="text-muted-foreground">Try adjusting your search or add an owner</p>
          </div>
        )}
      </div>
    </div>
  )
}
