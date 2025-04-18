'use client'

import { useEffect, type ReactNode } from 'react'
import { initBrowserTracing } from '@/lib/browser-tracing'

export function TracingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize browser tracing on client-side only
    if (typeof window !== 'undefined') {
      initBrowserTracing()
    }
  }, [])

  return <>{children}</>
}
