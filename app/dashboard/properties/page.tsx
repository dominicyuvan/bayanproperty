'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Search, Filter, Building2, MapPin, Home, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { PropertyForm } from '@/components/properties/property-form'
import { OMAN_GOVERNORATES, type PropertyType } from '@/lib/types'

// Demo data
const demoProperties = [
  {
    id: '1',
    nameEn: 'Al Mouj Residences',
    nameAr: 'سكن الموج',
    type: 'residential_building' as PropertyType,
    governorate: 'Muscat' as const,
    city: 'Al Mouj',
    addressEn: 'Al Mouj, Muscat',
    addressAr: 'الموج، مسقط',
    totalUnits: 48,
    occupiedUnits: 42,
    images: [],
    amenities: ['Pool', 'Gym', 'Parking'],
  },
  {
    id: '2',
    nameEn: 'Qurum Business Center',
    nameAr: 'مركز القرم للأعمال',
    type: 'commercial_building' as PropertyType,
    governorate: 'Muscat' as const,
    city: 'Qurum',
    addressEn: 'Qurum Heights, Muscat',
    addressAr: 'مرتفعات القرم، مسقط',
    totalUnits: 24,
    occupiedUnits: 20,
    images: [],
    amenities: ['Elevator', 'Security', 'Parking'],
  },
  {
    id: '3',
    nameEn: 'Salalah Palm Villas',
    nameAr: 'فلل نخيل صلالة',
    type: 'villa_compound' as PropertyType,
    governorate: 'Dhofar' as const,
    city: 'Salalah',
    addressEn: 'West Salalah, Dhofar',
    addressAr: 'غرب صلالة، ظفار',
    totalUnits: 12,
    occupiedUnits: 10,
    images: [],
    amenities: ['Garden', 'Parking', 'Security'],
  },
]

export default function PropertiesPage() {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const tGov = useTranslations('governorates')
  const { locale } = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [governorateFilter, setGovernorateFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredProperties = demoProperties.filter((property) => {
    const name = locale === 'ar' ? property.nameAr : property.nameEn
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGovernorate = governorateFilter === 'all' || property.governorate === governorateFilter
    const matchesType = typeFilter === 'all' || property.type === typeFilter
    return matchesSearch && matchesGovernorate && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {demoProperties.length} {t('title').toLowerCase()}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="me-2 h-4 w-4" />
              {t('addProperty')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addProperty')}</DialogTitle>
              <DialogDescription>
                Add a new property to your portfolio
              </DialogDescription>
            </DialogHeader>
            <PropertyForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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
            <SelectItem value="all">{tCommon('all')} {t('governorate')}</SelectItem>
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
            <SelectItem value="all">{tCommon('all')} {t('propertyType')}</SelectItem>
            <SelectItem value="residential_building">{t('types.residential_building')}</SelectItem>
            <SelectItem value="commercial_building">{t('types.commercial_building')}</SelectItem>
            <SelectItem value="mixed_use">{t('types.mixed_use')}</SelectItem>
            <SelectItem value="villa_compound">{t('types.villa_compound')}</SelectItem>
            <SelectItem value="single_villa">{t('types.single_villa')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => {
          const name = locale === 'ar' ? property.nameAr : property.nameEn
          const address = locale === 'ar' ? property.addressAr : property.addressEn
          const occupancyRate = Math.round((property.occupiedUnits / property.totalUnits) * 100)

          return (
            <Card key={property.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        {tGov(property.governorate)}, {property.city}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  {t(`types.${property.type}`)}
                </Badge>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    {property.totalUnits} {t('totalUnits').toLowerCase()}
                  </div>
                  <span className="font-medium text-primary">{occupancyRate}%</span>
                </div>
                
                <div className="h-2 rounded-full bg-secondary">
                  <div 
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{property.occupiedUnits} occupied</span>
                  <span>{property.totalUnits - property.occupiedUnits} vacant</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProperties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No properties found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
