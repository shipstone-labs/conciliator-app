import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { appConfig } from './config.mjs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Footer } from '@/components/Footer'
import AuthLayout from './authLayout'
import NavigationHeader from '@/components/NavigationHeader'
import { ConfigProvider } from '@/lib/ConfigContext'
import { getServerConfig } from '@/lib/getServerConfig'
import { Suspense } from 'react'
import Loading from '@/components/Loading'
import ClientProviders from './client-provider'

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

// Add revalidation to the page - revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get config safely based on the rendering context
  const serverConfig = await getServerConfig()

  return (
    <TooltipProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            <Suspense fallback={<Loading />}>
              {/* Wrap with ConfigProvider to make config available to all components */}
              <ConfigProvider config={serverConfig}>
                <ClientProviders>
                  <AuthLayout>
                    <header className="fixed top-0 left-0 right-0 z-10 bg-[#2B5B75] border-b border-border/40 h-16 flex items-center px-4">
                      <NavigationHeader />
                    </header>
                    <main className="flex-grow bg-gradient-to-b from-[#2B5B75] to-background pt-16">
                      {children}
                    </main>
                  </AuthLayout>
                  <Footer />
                </ClientProviders>
              </ConfigProvider>
            </Suspense>
          </div>
        </body>
      </html>
    </TooltipProvider>
  )
}
