'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import { LeaseContractForm } from '@/components/leases/lease-contract-form'
import { deleteLeaseRecord, subscribeLeases } from '@/lib/leases-db'
import { subscribeTenantRecords } from '@/lib/tenants-db'
import type { LeaseContract, LeaseContractStatus, TenantRecord } from '@/lib/types'

const statusStyles: Record<LeaseContractStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
}

export default function LeasesPage() {
  const t = useTranslations('leases')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const [leases, setLeases] = useState<LeaseContract[]>([])
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [leaseFormKey, setLeaseFormKey] = useState(0)
  const [editLeaseId, setEditLeaseId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const listErrorShown = useRef(false)

  useEffect(() => {
    listErrorShown.current = false
    const onError = (err: Error) => {
      if (!listErrorShown.current) {
        listErrorShown.current = true
        toast.error(tErrors('somethingWentWrong'))
        console.error(err)
      }
    }
    const unsubLeases = subscribeLeases(
      (rows) => {
        setLeases(rows)
        setLoading(false)
      },
      onError,
    )
    const unsubTenants = subscribeTenantRecords((rows) => setTenants(rows))
    return () => {
      unsubLeases()
      unsubTenants()
    }
  }, [tErrors])

  const tenantNameById = new Map(tenants.map((x) => [x.id, x.nameEn]))
  const filtered = leases.filter((row) => {
    const tenantName = tenantNameById.get(row.tenantId) ?? ''
    const q = searchQuery.toLowerCase()
    const matchSearch =
      row.contractNumber.toLowerCase().includes(q) || tenantName.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || row.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleDelete = async () => {
    if (!deleteTargetId) return
    try {
      await deleteLeaseRecord(deleteTargetId)
      toast.success(t('leaseDeleted'))
    } catch {
      toast.error(tErrors('somethingWentWrong'))
    } finally {
      setDeleteTargetId(null)
    }
  }

  const editLease = leases.find((x) => x.id === editLeaseId)
  const toDateInput = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {leases.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) setLeaseFormKey((k) => k + 1)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addLease')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addLease')}</DialogTitle>
            </DialogHeader>
            <LeaseContractForm key={leaseFormKey} onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={editLeaseId !== null} onOpenChange={(open) => !open && setEditLeaseId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tCommon('edit')}</DialogTitle>
          </DialogHeader>
          {editLease ? (
            <LeaseContractForm
              leaseId={editLease.id}
              onSuccess={() => setEditLeaseId(null)}
              initialData={{
                tenantId: editLease.tenantId,
                status: editLease.status,
                paymentMethod: editLease.paymentMethod,
                propertyId: editLease.propertyId,
                unitId: editLease.unitId,
                contractStartDate: toDateInput(editLease.contractStartDate),
                contractEndDate: toDateInput(editLease.contractEndDate),
                contractTermMonths: editLease.contractTermMonths,
                specialTerms: editLease.specialTerms || '',
                description: editLease.description || '',
                customerSignedBy: editLease.customerSignedBy || '',
                customerSignedDate: toDateInput(editLease.customerSignedDate),
                companySignedBy: editLease.companySignedBy || '',
                companySignedDate: toDateInput(editLease.companySignedDate),
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')}</SelectItem>
            {(['draft', 'active', 'expired', 'terminated'] as LeaseContractStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('contractNumber')}</TableHead>
                <TableHead>{t('tenant')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{t('startDate')}</TableHead>
                <TableHead>{t('endDate')}</TableHead>
                <TableHead>{t('paymentMethodLabel')}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' ? t('noResults') : t('noLeases')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-mono text-sm">{lease.contractNumber}</TableCell>
                    <TableCell>{tenantNameById.get(lease.tenantId) ?? '—'}</TableCell>
                    <TableCell>
                      <Badge className={statusStyles[lease.status]}>{t(`status.${lease.status}`)}</Badge>
                    </TableCell>
                    <TableCell>{lease.contractStartDate.toLocaleDateString()}</TableCell>
                    <TableCell>{lease.contractEndDate ? lease.contractEndDate.toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{lease.paymentMethod ? t(`paymentMethod.${lease.paymentMethod}`) : '—'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="me-2 h-4 w-4" />
                            {tCommon('view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditLeaseId(lease.id)}>
                            <Pencil className="me-2 h-4 w-4" />
                            {tCommon('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTargetId(lease.id)}
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {tCommon('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
