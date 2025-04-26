'use client'

import { useEffect, type ReactNode } from 'react'
import { initBrowserTracing } from '@/lib/browser-tracing'
import { useConfig } from './AuthLayout'

export function TracingProvider({ children }: { children: ReactNode }) {
  const config = useConfig()
  useEffect(() => {
    // Initialize browser tracing on client-side only
    if (typeof window !== 'undefined') {
      initBrowserTracing(config)
    }
  }, [config])

  return <>{children}</>
}
