import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Bayan Property Management',
  description: 'Bayan Property Management — property operations for Oman',
  applicationName: 'Bayan Property Management',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#810c3c',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const messages = await getMessages()

  return (
    <html lang="en" dir="ltr" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
