'use client'

import { useAppConfig } from '@/lib/ConfigContext'
import { getStripePayments } from '@invertase/firestore-stripe-payments'
import { StytchProvider } from '@stytch/nextjs'
import { createStytchUIClient } from '@stytch/nextjs/ui'
import { type FirebaseApp, initializeApp } from 'firebase/app'
import { createContext, useContext, type PropsWithChildren } from 'react'

// Stytch client configuration
const stytchOptions = {
  cookieOptions: {
    opaqueTokenCookieName: 'stytch_session',
    jwtCookieName: 'stytch_session_jwt',
    path: '',
    availableToSubdomains: false,
    domain: '',
  },
}

const configContext = createContext<AppConfig>({} as AppConfig)

// Define the type for our configuration
export interface AppConfig {
  [key: string]: unknown
  app: FirebaseApp
  payments: ReturnType<typeof getStripePayments>
  stytchClient: ReturnType<typeof createStytchUIClient>
}

/**
 * Hook to fetch and use the application configuration from the /api/config endpoint
 */
export function useConfig() {
  return useContext(configContext)
}

// Global instance state to prevent reinitializing during React Strict Mode
let globalInstance: Partial<AppConfig> | undefined

export default function AuthLayout({ children }: PropsWithChildren) {
  const appConfig = useAppConfig()

  // Create the enhanced config with initialized services
  let config: AppConfig = appConfig as unknown as AppConfig

  // Don't proceed with initialization if we have a static config
  if (appConfig.ENV === 'static') {
    return (
      <configContext.Provider value={config}>
        <StytchProvider stytch={config.stytchClient}>{children}</StytchProvider>
      </configContext.Provider>
    )
  }

  // If we already have an initialized instance, use it
  if (globalInstance) {
    config = { ...appConfig, ...globalInstance } as AppConfig
  } else {
    const { FIREBASE_CONFIG, STYTCH_PUBLIC_TOKEN, ...rest } = appConfig

    // Initialize Firebase
    const app = initializeApp(FIREBASE_CONFIG)

    // Initialize Stripe Payments
    const payments = getStripePayments(app, {
      customersCollection: 'customers',
      productsCollection: 'products',
    })

    // Initialize Stytch client with public token
    const stytchClient = createStytchUIClient(
      (STYTCH_PUBLIC_TOKEN as string) || '',
      stytchOptions
    )

    // Store the instances both in ref and global variable
    config = { ...rest, app, payments, stytchClient }
    globalInstance = config
  }

  // Don't render anything if we don't have a valid config
  if (!config) {
    throw new Error('Invalid configuration. Cannot render layout.')
  }

  // Render the config provider and StytchProvider
  return (
    <configContext.Provider value={config}>
      <StytchProvider stytch={config.stytchClient}>{children}</StytchProvider>
    </configContext.Provider>
  )
}
