'use client'

import { useAppConfig } from '@/lib/ConfigContext'
import { StytchProvider } from '@stytch/nextjs'
import { createStytchUIClient } from '@stytch/nextjs/ui'
import { useMemo, type PropsWithChildren } from 'react'

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

export default function AuthLayout({ children }: PropsWithChildren) {
  const config = useAppConfig()
  const stytchClient = useMemo(() => {
    if (!config.STYTCH_PUBLIC_TOKEN) {
      return undefined
    }
    const stytchClient = createStytchUIClient(
      (config.STYTCH_PUBLIC_TOKEN as string) || '',
      stytchOptions
    )
    return stytchClient
  }, [config.STYTCH_PUBLIC_TOKEN])
  if (!stytchClient) {
    return null
  }
  return <StytchProvider stytch={stytchClient}>{children}</StytchProvider>
}
