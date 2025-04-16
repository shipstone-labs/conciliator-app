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
  const serverConfig = await getServerConfig()
  
  return (
    <TooltipProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            {/* Wrap with ConfigProvider to make config available to all components */}
            <ConfigProvider config={serverConfig}>
              <AuthLayout>
                <header className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-primary/90 to-primary/70 border-b border-border h-16 flex items-center px-4 shadow-sm">
                  <NavigationHeader />
                </header>
                <main className="flex-grow bg-gradient-to-b from-gradient-start to-gradient-end pt-16">
                  {children}
                </main>
              </AuthLayout>
              <Footer />
            </ConfigProvider>
          </div>
        </body>
      </html>
    </TooltipProvider>
  )
}