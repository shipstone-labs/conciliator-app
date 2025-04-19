'use client'

import type { ReactNode } from 'react'
import { TracingProvider } from '@/components/TracingProvider'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <TracingProvider>{children}</TracingProvider>
}
