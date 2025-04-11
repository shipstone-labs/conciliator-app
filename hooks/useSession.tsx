'use client'

import { sessionContext } from '@/components/Authenticated'
import { useContext } from 'react'

export const useSession = () => {
  const context = useContext(sessionContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
