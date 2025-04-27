'use client'

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  type PropsWithChildren,
  useSyncExternalStore,
} from 'react'
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
  initializeConfig,
  type SuspendPromise,
} from '@/lib/session'
import { StytchProvider } from '@stytch/nextjs'
import type { RawAppConfig } from '@/lib/ConfigContext'
import { AuthModal } from './AuthModal'

const sessionContext = createContext<Session | undefined>(globalSession)
const configContext = createContext<AppConfig | undefined>(globalInstance)

export function useConfig() {
  const config = useContext(configContext)
  if (!config) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return config
}

export function useSession(
  items: ('stytchUser' | 'fbUser' | 'sessionSigs')[] = []
) {
  const session = globalSession as Session
  useSyncExternalStore(
    globalSession?.subscribe ||
      ((_onStoreChange: () => void) => {
        return () => {}
      }),
    () => (globalSession as Session).state,
    () => (globalSession as Session).state
  )
  if (typeof window !== 'undefined') {
    for (const key of items) {
      const result = (
        session[key] as SuspendPromise<Promise<any> | undefined, any>
      ).value(...(key === 'stytchUser' ? [true] : []))
      if (result && 'then' in result) {
        if (key === 'stytchUser') {
          throw result
        }
      }
    }
  }
  return session
}

/**
 * Hook to fetch and use the application configuration from the /api/config endpoint
 */

export default function AuthLayout({
  children,
  appConfig,
}: PropsWithChildren<{ appConfig: RawAppConfig }>) {
  initializeConfig(appConfig)

  const session = useSession()
  // Handle successful authentication
  const handleAuthSuccess = useCallback(() => {
    if (session?.authPromise) {
      session.authPromise.closed = true
    }
  }, [session])

  const onClose = useCallback(() => {
    if (session?.authPromise) {
      session.authPromise.close()
    }
  }, [session?.authPromise])

  if (!session) {
    return <Loading />
  }
  // Render the config provider and StytchProvider
  return (
    <configContext.Provider value={globalInstance}>
      <sessionContext.Provider value={session}>
        <StytchProvider stytch={session.stytchClient}>
          <TooltipProvider>
            <ClientProviders>
              <AuthModal
                onClose={!session.authPromise?.required ? onClose : undefined}
                isOpen={
                  session.authPromise != null && !session.authPromise.closed
                }
                authPromise={session.authPromise}
                onSuccess={handleAuthSuccess}
              />
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
            </ClientProviders>
          </TooltipProvider>
        </StytchProvider>
      </sessionContext.Provider>
    </configContext.Provider>
  )
}
