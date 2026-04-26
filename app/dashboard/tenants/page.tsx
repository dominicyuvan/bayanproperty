'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, Eye, Mail, Phone, FileStack } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TenantForm } from '@/components/tenants/tenant-form'
import { RosterDocumentsPanel } from '@/components/roster/roster-documents-panel'
import { ExpiryStatusDot } from '@/components/party/expiry-status-dot'
import { useOpenAddDialogFromQuery } from '@/hooks/use-open-add-dialog-from-query'
import { deleteTenantRecord, subscribeTenantRecords } from '@/lib/tenants-db'
import { getExpiryUrgency } from '@/lib/expiry-urgency'
import { getPrimaryExpiryForParty } from '@/lib/party-display'
import type { TenantLeaseStatus, TenantRecord } from '@/lib/types'

const leaseBadge: Record<TenantLeaseStatus, { variant: 'default' | 'secondary' | 'outline' }> = {
  active: { variant: 'default' },
  expired: { variant: 'secondary' },
  pending: { variant: 'outline' },
}

export default function TenantsPage() {
  const t = useTranslations('tenants')
  const tCommon = useTranslations('common')
  const tParty = useTranslations('party')
  const tErrors = useTranslations('errors')
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editTenantId, setEditTenantId] = useState<string | null>(null)
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null)
  const [tenantFormKey, setTenantFormKey] = useState(0)
  const [documentsTenantId, setDocumentsTenantId] = useState<string | null>(null)
  const listErrorShown = useRef(false)

  useOpenAddDialogFromQuery(setIsAddDialogOpen, () => setTenantFormKey((k) => k + 1))

  useEffect(() => {
    listErrorShown.current = false
    const unsubscribe = subscribeTenantRecords(
      (rows) => setTenants(rows),
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

  const filtered = tenants.filter((row) => {
    const name = row.nameEn.toLowerCase()
    const q = searchQuery.toLowerCase()
    const idBits = [row.idNumber, row.crNumber, row.contactPersonName]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase())
    return (
      name.includes(q) ||
      row.nameAr.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      row.unitNumber.toLowerCase().includes(q) ||
      idBits.some((s) => s.includes(q)) ||
      row.partyType.toLowerCase().includes(q)
    )
  })
  const editTenant = editTenantId ? tenants.find((tnt) => tnt.id === editTenantId) ?? null : null
  const deleteTenant = deleteTenantId ? tenants.find((tnt) => tnt.id === deleteTenantId) ?? null : null
  const toDateInput = (value?: Date) => (value ? value.toISOString().slice(0, 10) : '')

  const handleDelete = async () => {
    if (!deleteTenantId) return
    try {
      await deleteTenantRecord(deleteTenantId)
      toast.success(tCommon('delete'))
      setDeleteTenantId(null)
    } catch (error) {
      console.error(error)
      toast.error(tErrors('somethingWentWrong'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {tenants.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) setTenantFormKey((k) => k + 1)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addTenant')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addTenant')}</DialogTitle>
              <DialogDescription>{t('addTenantDescription')}</DialogDescription>
            </DialogHeader>
            <TenantForm key={tenantFormKey} onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={documentsTenantId !== null} onOpenChange={(open) => !open && setDocumentsTenantId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('documentsDialogTitle')}</DialogTitle>
            <DialogDescription>{t('documentsDialogDescription')}</DialogDescription>
          </DialogHeader>
          {documentsTenantId ? (
            <RosterDocumentsPanel entity="tenants" entityId={documentsTenantId} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editTenantId !== null} onOpenChange={(open) => !open && setEditTenantId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tCommon('edit')}</DialogTitle>
          </DialogHeader>
          {editTenant ? (
            <TenantForm
              tenantId={editTenant.id}
              onSuccess={() => setEditTenantId(null)}
              initialData={{
                partyType: editTenant.partyType,
                salutation: editTenant.salutation,
                firstName: editTenant.firstName ?? '',
                lastName: editTenant.lastName ?? '',
                nameEn: editTenant.nameEn,
                nameAr: editTenant.nameAr,
                nationality: editTenant.nationality ?? 'OM',
                individualIdType: editTenant.individualIdType ?? 'national_id',
                idNumber: editTenant.idNumber ?? '',
                idExpiryDate: toDateInput(editTenant.idExpiryDate),
                email: editTenant.email,
                phone: editTenant.phone,
                mobile: editTenant.mobile ?? '',
                title: editTenant.title ?? '',
                contactPersonName: editTenant.contactPersonName ?? '',
                contactPersonPhone: editTenant.contactPersonPhone ?? '',
                crNumber: editTenant.crNumber ?? '',
                crExpiryDate: toDateInput(editTenant.crExpiryDate),
                mailingStreet: editTenant.mailingStreet ?? '',
                mailingCity: editTenant.mailingCity ?? '',
                mailingStateProvince: editTenant.mailingStateProvince ?? '',
                mailingZip: editTenant.mailingZip ?? '',
                mailingCountry: editTenant.mailingCountry ?? 'Oman',
                birthdate: toDateInput(editTenant.birthdate),
                leadSource: editTenant.leadSource,
                department: editTenant.department ?? '',
                unitNumber: editTenant.unitNumber,
                leaseStatus: editTenant.leaseStatus,
                description: editTenant.description ?? '',
                iban: editTenant.iban ?? '',
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTenantId !== null} onOpenChange={(open) => !open && setDeleteTenantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTenant?.nameEn ?? ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{tCommon('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <TableHead className="w-[7.5rem]">{tParty('typeColumn')}</TableHead>
              <TableHead className="w-[7rem]">{tParty('expiryColumn')}</TableHead>
              <TableHead className="hidden md:table-cell max-w-[14rem]">{tCommon('email')}</TableHead>
              <TableHead className="hidden lg:table-cell w-[9rem]">{tCommon('phone')}</TableHead>
              <TableHead className="w-[7rem]">{t('currentUnit')}</TableHead>
              <TableHead>{t('leaseStatus')}</TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const name = row.nameEn
              const lease = leaseBadge[row.leaseStatus]
              const exp = getPrimaryExpiryForParty(row)
              const expU = getExpiryUrgency(exp)

              return (
                <TableRow key={row.id}>
                  <TableCell className="min-w-0 max-w-[14rem]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="truncate font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {row.partyType === 'company' ? tParty('company') : tParty('individual')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ExpiryStatusDot urgency={expU} title={exp ? exp.toLocaleDateString() : undefined} />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {exp ? exp.toLocaleDateString() : '—'}
                      </span>
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
                  <TableCell>
                    <span className="block truncate text-sm tabular-nums">{row.unitNumber}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lease.variant} className="text-xs whitespace-nowrap">
                      {t(`lease.${row.leaseStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-12 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDocumentsTenantId(row.id)}>
                          <FileStack className="me-2 h-4 w-4" />
                          {t('openDocuments')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="me-2 h-4 w-4" />
                          {tCommon('view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditTenantId(row.id)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {tCommon('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTenantId(row.id)}>
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
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              No tenants found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
