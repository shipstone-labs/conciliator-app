'use client'

import {
  createContext,
  type MouseEvent,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  type PropsWithChildren,
  useMemo,
} from 'react'
import { useState } from 'react'
import Loading from '@/components/Loading'
import ClientProviders from '@/app/client-provider'
import NavigationHeader from './NavigationHeader'
import { Footer } from './Footer'
import { TooltipProvider } from './ui/tooltip'
import {
  type Session,
  type AppConfig,
  globalSession,
  globalInstance,
  type SessionState,
  initializeConfig,
  DefaultState,
  type SuspendPromise,
} from '@/lib/session'
import { StytchProvider } from '@stytch/nextjs'
import type { RawAppConfig } from '@/lib/ConfigContext'
import { AuthModal } from './AuthModal'
import { usePathname } from 'next/navigation'

const sessionContext = createContext<Session | undefined>(globalSession)
const configContext = createContext<AppConfig | undefined>(globalInstance)

export function useConfig() {
  const config = useContext(configContext)
  if (!config) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return config
}

export function useSession() {
  const context = useContext(sessionContext)
  if (context == null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to fetch and use the application configuration from the /api/config endpoint
 */

export default function AuthLayout({
  children,
  appConfig,
}: PropsWithChildren<{ appConfig: RawAppConfig }>) {
  const [{ session, config }, setInfo] = useState<{
    config?: AppConfig
    session?: Session
  }>({})
  useEffect(() => {
    initializeConfig(appConfig)
    setInfo({ session: globalSession, config: globalInstance })
  }, [appConfig])
  const [, setState] = useState<SessionState>(session?.state || DefaultState)
  useEffect(() => {
    if (!session) {
      return
    }
    session.inject({
      setState,
      config: globalInstance,
    })
    return () => {
      session.inject({
        setState: null,
      })
    }
  }, [session])
  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    if (session?.authPromise) {
      session.authPromise.closed = true
    }
  }, [session])

  const pathname = usePathname()
  const onClose = useMemo(
    (event?: MouseEvent<HTMLElement>) => {
      if (!event) {
        return () => {
          if (session?.authPromise) {
            session.authPromise.close()
          }
        }
      }
      if (pathname === '/') {
        return () => {
          if (session?.authPromise) {
            session.authPromise.close()
          }
        }
      }
      return () => {
        window.location.href = '/'
        if (session?.authPromise) {
          session.authPromise.close()
        }
      }
    },
    [pathname, session?.authPromise]
  )

  if (!session || !config) {
    return <Loading />
  }
  // Render the config provider and StytchProvider
  return (
    <configContext.Provider value={config}>
      <sessionContext.Provider value={session}>
        <StytchProvider stytch={session.stytchClient}>
          <TooltipProvider>
            <ClientProviders>
              <Suspense fallback={<Loading />}>
                {/* Wrap with ConfigProvider to make config available to all components */}
                <header className="fixed top-0 left-0 right-0 z-10 bg-[#2B5B75] border-b border-border/40 h-16 flex items-center px-4">
                  <NavigationHeader />
                </header>
                <main className="flex-grow bg-gradient-to-b from-[#2B5B75] to-background pt-16">
                  {children}
                </main>
              </Suspense>
              <Footer />
              <AuthModal
                onClose={onClose}
                isOpen={
                  session.authPromise != null && !session.authPromise.closed
                }
                onSuccess={handleAuthSuccess}
              />
            </ClientProviders>
          </TooltipProvider>
        </StytchProvider>
      </sessionContext.Provider>
    </configContext.Provider>
  )
}

// Helper function to create and throw a login request promise
export function useRequire(
  items: ('stytchUser' | 'fbUser' | 'sessionSigs')[] = []
) {
  const session = useSession()
  for (const key of items) {
    const result = (
      session[key] as SuspendPromise<Promise<any> | undefined>
    ).value()
    if (result && 'then' in result) {
      if (key === 'stytchUser') {
        throw result
      }
    }
  }
}
