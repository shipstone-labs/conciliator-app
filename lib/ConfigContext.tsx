'use client'

import { createContext, useContext, useState } from 'react'

// Define the type for our configuration
export interface RawAppConfig {
  FIREBASE_CONFIG: Record<string, unknown>
  [key: string]: string | Record<string, unknown> | undefined
}

const ConfigContext = createContext<RawAppConfig | undefined>(undefined)

// Provider component that makes the config available to client components
export function ConfigProvider({
  config: initialConfig,
  children,
}: {
  config: RawAppConfig
  children: React.ReactNode
}) {
  const [config, setConfig] = useState<RawAppConfig>(initialConfig)

  if (typeof window !== 'undefined' && initialConfig.ENV === 'static') {
    throw fetch('/api/config')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`)
        }

        return response.json()
      })
      .then((data) => {
        setConfig({
          ...data.config,
          CONFIG_SOURCE: 'client-api-fetch',
        })
      })
  }
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  )
}

// Hook to use the config in any component
export function useAppConfig() {
  const context = useContext(ConfigContext)

  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider')
  }

  return context
}
