'use client'

import { useTranslations } from 'next-intl'
import { 
  Building2, 
  Home, 
  Users, 
  CreditCard, 
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatOMR } from '@/lib/types'

// Demo data - will be replaced with real data from Firebase
const stats = {
  totalProperties: 12,
  totalUnits: 156,
  occupiedUnits: 134,
  vacantUnits: 22,
  pendingPayments: 8,
  overduePayments: 3,
  maintenanceRequests: 5,
  monthlyRevenue: 45250.500,
}

const recentActivities = [
  { id: 1, type: 'payment', titleEn: 'Rent payment received', titleAr: 'تم استلام دفعة الإيجار', unit: 'A-101', amount: 350, date: new Date() },
  { id: 2, type: 'maintenance', titleEn: 'New maintenance request', titleAr: 'طلب صيانة جديد', unit: 'B-205', date: new Date(Date.now() - 3600000) },
  { id: 3, type: 'lease', titleEn: 'Lease renewal signed', titleAr: 'تم توقيع تجديد العقد', unit: 'C-302', date: new Date(Date.now() - 7200000) },
  { id: 4, type: 'payment', titleEn: 'Payment overdue', titleAr: 'دفعة متأخرة', unit: 'A-105', amount: 400, date: new Date(Date.now() - 86400000) },
]

export function DashboardContent() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const { user } = useAuth()
  const { locale } = useLocale()

  const displayName = locale === 'ar' ? user?.nameAr : user?.nameEn

  const occupancyRate = Math.round((stats.occupiedUnits / stats.totalUnits) * 100)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          {t('welcome', { name: displayName || 'User' })}
        </h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalProperties')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUnits} {t('totalUnits').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('occupiedUnits')}</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupiedUnits}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{occupancyRate}%</span>
              <span className="text-muted-foreground">occupancy</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingPayments')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            {stats.overduePayments > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">{stats.overduePayments} {t('overduePayments').toLowerCase()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('maintenanceRequests')}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceRequests}</div>
            <p className="text-xs text-muted-foreground">
              open requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Vacancy Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Monthly Revenue
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardTitle>
            <CardDescription>Total rent collected this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatOMR(stats.monthlyRevenue)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-green-600">+5.2%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t('vacantUnits')}
              <Home className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>Units available for rent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.vacantUnits}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vacancy Rate</span>
                <span className="font-medium">{100 - occupancyRate}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${100 - occupancyRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="justify-start">
              <Building2 className="me-2 h-4 w-4" />
              Add Property
            </Button>
            <Button variant="outline" className="justify-start">
              <Home className="me-2 h-4 w-4" />
              Add Unit
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="me-2 h-4 w-4" />
              Add Tenant
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="me-2 h-4 w-4" />
              Record Payment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                    activity.type === 'maintenance' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'payment' && <CreditCard className="h-3 w-3" />}
                    {activity.type === 'maintenance' && <Wrench className="h-3 w-3" />}
                    {activity.type === 'lease' && <Users className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {locale === 'ar' ? activity.titleAr : activity.titleEn}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {activity.unit}
                      </Badge>
                      {activity.amount && (
                        <span className="font-medium text-foreground">
                          {formatOMR(activity.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
                      Math.round((activity.date.getTime() - Date.now()) / 3600000),
                      'hour'
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
