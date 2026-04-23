'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, Check, Mail, MessageSquare, CreditCard, Wrench, Megaphone, Building } from 'lucide-react'
import { useLocale } from '@/contexts/locale-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// Demo notifications
const demoNotifications = [
  {
    id: '1',
    type: 'announcement',
    titleEn: 'Scheduled Maintenance - Water Supply',
    titleAr: 'صيانة مجدولة - إمدادات المياه',
    messageEn: 'Water supply will be temporarily interrupted tomorrow.',
    messageAr: 'سيتم قطع إمدادات المياه مؤقتاً غداً.',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    type: 'payment',
    titleEn: 'Payment Received',
    titleAr: 'تم استلام الدفعة',
    messageEn: 'Your rent payment of OMR 450.000 has been received.',
    messageAr: 'تم استلام دفعة الإيجار بمبلغ 450.000 ر.ع.',
    read: false,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: '3',
    type: 'maintenance',
    titleEn: 'Maintenance Request Update',
    titleAr: 'تحديث طلب الصيانة',
    messageEn: 'Your AC repair request has been assigned to a technician.',
    messageAr: 'تم تعيين طلب إصلاح المكيف لفني.',
    read: true,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '4',
    type: 'association',
    titleEn: 'Meeting Reminder',
    titleAr: 'تذكير بالاجتماع',
    messageEn: 'Annual general meeting is scheduled for February 1st.',
    messageAr: 'الاجتماع العام السنوي مقرر في 1 فبراير.',
    read: true,
    createdAt: new Date(Date.now() - 172800000),
  },
]

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  announcement: Megaphone,
  payment: CreditCard,
  maintenance: Wrench,
  association: Building,
}

export default function NotificationsPage() {
  const t = useTranslations('notifications')
  const tCommon = useTranslations('common')
  const { locale } = useLocale()
  const [notifications, setNotifications] = useState(demoNotifications)
  
  // Notification preferences state
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    categories: {
      announcements: { email: true, sms: true },
      payments: { email: true, sms: false },
      maintenance: { email: true, sms: false },
      association: { email: true, sms: false },
    },
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const togglePreference = (
    category: keyof typeof preferences.categories,
    channel: 'email' | 'sms'
  ) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          [channel]: !prev.categories[category][channel],
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : t('noNotifications')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="me-2 h-4 w-4" />
            {t('markAllRead')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {t('title')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            {t('preferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">{t('noNotifications')}</h3>
            </div>
          ) : (
            notifications.map((notification) => {
              const title = locale === 'ar' ? notification.titleAr : notification.titleEn
              const message = locale === 'ar' ? notification.messageAr : notification.messageEn
              const Icon = typeIcons[notification.type] || Bell

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted/50',
                    !notification.read && 'border-primary/50 bg-primary/5'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      !notification.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          !notification.read && 'font-medium'
                        )}>
                          {title}
                        </p>
                        {!notification.read && (
                          <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
                          Math.round((notification.createdAt.getTime() - Date.now()) / 3600000),
                          'hour'
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('preferences')}</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Global Settings</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t('emailNotifications')}</span>
                  </div>
                  <Switch
                    checked={preferences.email}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t('smsNotifications')}</span>
                  </div>
                  <Switch
                    checked={preferences.sms}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
              </div>

              {/* Category Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('categories')}</h4>
                <div className="space-y-4">
                  {(Object.keys(preferences.categories) as Array<keyof typeof preferences.categories>).map((category) => (
                    <div key={category} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center gap-2">
                        {category === 'announcements' && <Megaphone className="h-4 w-4 text-muted-foreground" />}
                        {category === 'payments' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                        {category === 'maintenance' && <Wrench className="h-4 w-4 text-muted-foreground" />}
                        {category === 'association' && <Building className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </div>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={preferences.categories[category].email}
                            onCheckedChange={() => togglePreference(category, 'email')}
                          />
                          Email
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={preferences.categories[category].sms}
                            onCheckedChange={() => togglePreference(category, 'sms')}
                          />
                          SMS
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full">
                {tCommon('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
