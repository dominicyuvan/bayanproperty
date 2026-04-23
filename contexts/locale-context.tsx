'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { defaultLocale, localeDirection, type Locale } from '@/i18n/config'

interface LocaleContextType {
  locale: Locale
  direction: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ 
  children,
  initialLocale = defaultLocale 
}: { 
  children: ReactNode
  initialLocale?: Locale 
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()

  useEffect(() => {
    // Read locale from cookie on mount
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale | undefined
    
    if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'ar')) {
      setLocaleState(cookieLocale)
    }
  }, [])

  useEffect(() => {
    // Update document direction when locale changes
    document.documentElement.dir = localeDirection[locale]
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    // Set cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    setLocaleState(newLocale)
    // Refresh to load new messages
    router.refresh()
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        direction: localeDirection[locale],
        setLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
