'use client'

import { useState, useEffect } from 'react'

// Define the type for our configuration
export interface AppConfig {
  [key: string]: any
  FIREBASE_CONFIG?: Record<string, any>
}

/**
 * Hook to fetch and use the application configuration from the /api/config endpoint
 */
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/config')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`)
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
  }, [])

  return { config, isLoading, error }
}

export default useConfig