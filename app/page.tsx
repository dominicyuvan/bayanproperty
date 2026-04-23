import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Building2, ArrowRight, Shield, Globe, BarChart3, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const t = await getTranslations('common')
  const tAuth = await getTranslations('auth')

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">{t('appName')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{tAuth('signIn')}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{tAuth('signUp')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Modern Property Management for{' '}
              <span className="text-primary">Oman</span>
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
              Streamline your property operations with our comprehensive management system. 
              Handle properties, units, tenants, payments, and more - all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">
                  Sign In to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything you need to manage properties
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={Building2}
                title="Property Management"
                description="Manage multiple properties and units with detailed tracking and organization."
              />
              <FeatureCard
                icon={Users}
                title="Tenant Relations"
                description="Handle tenant information, leases, and communication efficiently."
              />
              <FeatureCard
                icon={BarChart3}
                title="Payment Tracking"
                description="Track rent payments, service charges, and generate financial reports."
              />
              <FeatureCard
                icon={Globe}
                title="Bilingual Support"
                description="Full Arabic and English support with RTL layout for the Oman market."
              />
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Built for Oman</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Designed with local requirements in mind - OMR currency support, 
              all 11 governorates, +968 phone formats, and bilingual Arabic/English interface.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 {t('appName')}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
