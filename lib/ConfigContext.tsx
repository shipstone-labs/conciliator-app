'use client'

import { createContext, useContext, useMemo } from 'react'

// Define the type for our configuration
export interface RawAppConfig {
  FIREBASE_CONFIG: Record<string, unknown>
  HASH?: string // Add hash field for caching
  [key: string]: string | Record<string, unknown> | undefined
}

const ConfigContext = createContext<RawAppConfig | undefined>(undefined)
let configPromise: Promise<void> | undefined
let configRef: RawAppConfig | undefined

function getConfig(initialConfig: RawAppConfig) {
  // On the server, always use the provided config
  if (typeof window === 'undefined') {
    return initialConfig
  }

  // Already have a cached config
  if (configRef) {
    return configRef
  }

  // If we have a server-provided config with ENV='server'
  // This means we received proper server config during hydration
  if (initialConfig && initialConfig.ENV === 'server') {
    configRef = initialConfig
    return initialConfig
  }

  // Already fetching config
  if (configPromise) {
    throw configPromise
  }

  // Need to fetch config from API with proper caching
  const headers: HeadersInit = {}
  if (initialConfig?.HASH) {
    headers['If-None-Match'] = `"${initialConfig.HASH}"`
  }

  configPromise = fetch('/api/config', { headers })
    .then((response) => {
      // If 304 Not Modified, keep using current config
      if (response.status === 304) {
        configPromise = undefined
        return configRef
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      if (data) {
        configRef = data.config as RawAppConfig
        // Store the hash for future conditional requests
        configRef.HASH = data.hash
      }
      configPromise = undefined
      return configRef
    })
    .catch((error) => {
      configPromise = undefined
      throw error
    }) as Promise<void>
}
// Provider component that makes the config available to client components
export function ConfigProvider({
  config: initialConfig,
  children,
}: {
  config: RawAppConfig
  children: React.ReactNode
}) {
  const config = useMemo(() => getConfig(initialConfig), [initialConfig])
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
