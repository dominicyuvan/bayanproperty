'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Search, Building2, MapPin, MoreHorizontal, Pencil, Trash2, Eye, Home } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { PropertyForm } from '@/components/properties/property-form'
import { useOpenAddDialogFromQuery } from '@/hooks/use-open-add-dialog-from-query'
import { deletePropertyRecord, subscribeProperties } from '@/lib/properties-db'
import { MUSCAT_DISTRICT_SET } from '@/lib/muscat-districts'
import { OMAN_GOVERNORATES, type Property } from '@/lib/types'

export default function PropertiesPage() {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const tGov = useTranslations('governorates')
  const tErrors = useTranslations('errors')
  /** Muscat district keys are dynamic; next-intl keys are under `muscatDistricts.*`. */
  const tProps = t as (key: string) => string
  const muscatCityLabel = (governorate: string, city: string) =>
    governorate === 'Muscat' && MUSCAT_DISTRICT_SET.has(city) ? tProps(`muscatDistricts.${city}`) : city
  const [properties, setProperties] = useState<Property[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [governorateFilter, setGovernorateFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null)
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null)
  const [propertyFormKey, setPropertyFormKey] = useState(0)
  const listErrorShown = useRef(false)

  useOpenAddDialogFromQuery(setIsAddDialogOpen, () => setPropertyFormKey((k) => k + 1))

  useEffect(() => {
    listErrorShown.current = false
    const unsubscribe = subscribeProperties(
      (rows) => setProperties(rows),
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

  const filteredProperties = properties.filter((property) => {
    const name = property.nameEn
    const cityDisplay = muscatCityLabel(property.governorate, property.city)
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      name.toLowerCase().includes(q) ||
      property.nameAr.toLowerCase().includes(q) ||
      property.city.toLowerCase().includes(q) ||
      cityDisplay.toLowerCase().includes(q) ||
      (property.plotNumber?.toLowerCase().includes(q) ?? false)
    const matchesGovernorate = governorateFilter === 'all' || property.governorate === governorateFilter
    const matchesType = typeFilter === 'all' || property.type === typeFilter
    return matchesSearch && matchesGovernorate && matchesType
  })
  const editProperty = editPropertyId ? properties.find((p) => p.id === editPropertyId) ?? null : null
  const deleteProperty = deletePropertyId ? properties.find((p) => p.id === deletePropertyId) ?? null : null
  const toDateInput = (value?: Date) => (value ? value.toISOString().slice(0, 10) : '')

  const handleDelete = async () => {
    if (!deletePropertyId) return
    try {
      await deletePropertyRecord(deletePropertyId)
      toast.success(tCommon('delete'))
      setDeletePropertyId(null)
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
            {properties.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) setPropertyFormKey((k) => k + 1)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addProperty')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addProperty')}</DialogTitle>
              <DialogDescription>{t('addPropertyDescription')}</DialogDescription>
            </DialogHeader>
            <PropertyForm key={propertyFormKey} onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('governorate')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tCommon('all')} {t('governorate')}
            </SelectItem>
            {OMAN_GOVERNORATES.map((gov) => (
              <SelectItem key={gov} value={gov}>
                {tGov(gov)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('propertyType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tCommon('all')} {t('propertyType')}
            </SelectItem>
            <SelectItem value="residential_building">{t('types.residential_building')}</SelectItem>
            <SelectItem value="commercial_building">{t('types.commercial_building')}</SelectItem>
            <SelectItem value="mixed_use">{t('types.mixed_use')}</SelectItem>
            <SelectItem value="villa_compound">{t('types.villa_compound')}</SelectItem>
            <SelectItem value="single_villa">{t('types.single_villa')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={editPropertyId !== null} onOpenChange={(open) => !open && setEditPropertyId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tCommon('edit')}</DialogTitle>
          </DialogHeader>
          {editProperty ? (
            <PropertyForm
              propertyId={editProperty.id}
              onSuccess={() => setEditPropertyId(null)}
              initialData={{
                plotNumber: editProperty.plotNumber ?? '',
                nameEn: editProperty.nameEn,
                nameAr: editProperty.nameAr,
                status: editProperty.status,
                type: editProperty.type,
                usage: editProperty.usage,
                contractType: editProperty.contractType,
                completionPercent: editProperty.completionPercent,
                startDate: toDateInput(editProperty.startDate),
                handoverDate: toDateInput(editProperty.handoverDate),
                landAreaSqm: editProperty.landAreaSqm,
                builtUpAreaSqm: editProperty.builtUpAreaSqm,
                governorate: editProperty.governorate,
                city: editProperty.city,
                nationalAddress: editProperty.nationalAddress ?? '',
                totalUnits: editProperty.totalUnits,
                amenities: editProperty.amenities.join(', '),
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletePropertyId !== null} onOpenChange={(open) => !open && setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{deleteProperty?.nameEn ?? ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{tCommon('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[10rem] max-w-[14rem]">{t('propertyName')}</TableHead>
              <TableHead className="hidden lg:table-cell w-[6.5rem]">{t('plotNumber')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('propertyType')}</TableHead>
              <TableHead className="hidden xl:table-cell min-w-[9rem] max-w-[12rem]">
                {t('governorate')}
              </TableHead>
              <TableHead className="text-end tabular-nums">{t('totalUnits')}</TableHead>
              <TableHead className="hidden sm:table-cell text-end tabular-nums">{t('occupancy')}</TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.map((property) => {
              const name = property.nameEn
              const cityLabel = muscatCityLabel(property.governorate, property.city)
              const occupied = property.occupiedUnits ?? 0
              const total = Math.max(1, property.totalUnits)
              const occupancyRate = Math.round((occupied / total) * 100)

              return (
                <TableRow key={property.id}>
                  <TableCell className="min-w-0 max-w-[14rem]">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-tight">{name}</p>
                        <p className="mt-0.5 flex items-start gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="truncate">{cityLabel}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    <span className="line-clamp-2 text-sm">
                      {property.plotNumber?.trim() ? property.plotNumber : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="max-w-full whitespace-normal text-xs font-normal">
                      {t(`types.${property.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell min-w-0 max-w-[12rem]">
                    <p className="truncate text-sm">{tGov(property.governorate)}</p>
                    <p className="truncate text-xs text-muted-foreground">{cityLabel}</p>
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    <span className="text-sm font-medium">{occupied}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">{property.totalUnits}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-end">
                    <div className="ms-auto flex max-w-[5.5rem] flex-col items-end gap-1">
                      <span className="tabular-nums text-sm font-medium text-primary">{occupancyRate}%</span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-12 text-end align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="me-2 h-4 w-4" />
                          {tCommon('view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditPropertyId(property.id)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {tCommon('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletePropertyId(property.id)}
                        >
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

        {filteredProperties.length === 0 && (
          <div className="flex flex-col items-center justify-center border-t py-12 text-center">
            <Home className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              No properties found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
