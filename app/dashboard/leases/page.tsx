'use client'

import { useTranslations } from 'next-intl'
import { LeaseForm } from '@/components/leases/lease-form'

export default function LeasesPage() {
  const t = useTranslations('party')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('leasesPageTitle')}</h1>
        <p className="text-muted-foreground">{t('leasesPageDescription')}</p>
      </div>
      <LeaseForm />
    </div>
  )
}
