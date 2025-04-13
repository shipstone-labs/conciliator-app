'use client'

import { createContext, useContext, useState, useEffect } from 'react'

// Define the type for our configuration
export interface AppConfig {
  [key: string]: any
  FIREBASE_CONFIG?: Record<string, any>
}

// Create a context for the configuration
interface ConfigContextType {
  config: AppConfig
  isLoading: boolean
  error: Error | null
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

// Provider component that makes the config available to client components
export function ConfigProvider({
  config: initialConfig,
  children,
}: {
  config: AppConfig
  children: React.ReactNode
}) {
  const [config, setConfig] = useState<AppConfig>(initialConfig)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  // If we received a static config (from static generation), fetch the actual config
  useEffect(() => {
    // Only fetch if we're in a browser and we have a static config
    if (typeof window !== 'undefined' && initialConfig.ENV === 'static') {
      const fetchConfig = async () => {
        try {
          setIsLoading(true)
          const response = await fetch('/api/config')

          if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.status}`)
          }

          const data = await response.json()
          setConfig(data.config)
        } catch (err) {
          console.error('Error fetching config:', err)
          setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
          setIsLoading(false)
        }
      }

      fetchConfig()
    }
  }, [initialConfig])

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  )
}

// Hook to use the config in any component
export function useAppConfig() {
  const context = useContext(ConfigContext)

  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider')
  }

  return context.config
}

// Hook to get full config state including loading state
export function useConfigState() {
  const context = useContext(ConfigContext)

  if (context === undefined) {
    throw new Error('useConfigState must be used within a ConfigProvider')
  }

  return context
}
