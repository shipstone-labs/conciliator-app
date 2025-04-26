import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { appConfig } from './config.mjs'
import { getServerConfig } from '@/lib/getServerConfig'
import nextDynamic from 'next/dynamic'
import { ThemeProvider } from '@/components/theme-provider'

export const runtime = 'nodejs'

const AuthLayout = nextDynamic(() => import('@/components/AuthLayout'), {
  ssr: true,
})

// Force dynamic rendering for this layout
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: appConfig.themeColor,
}

export const metadata: Metadata = {
  title: appConfig.appName,
  icons: {
    icon: appConfig.icons,
  },
  applicationName: appConfig.appName,
  description: appConfig.description,
  other: appConfig.msapplication,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get config safely based on the rendering context
  const appConfig = await getServerConfig()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen">
            <AuthLayout appConfig={appConfig}>{children}</AuthLayout>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
