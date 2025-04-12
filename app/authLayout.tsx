'use client'

import { StytchProvider } from '@stytch/nextjs'
import { createStytchUIClient } from '@stytch/nextjs/ui'
import type { PropsWithChildren } from 'react'
import { logHydration } from '@/lib/debugUtils'

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

const stytchClient = createStytchUIClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || '',
  stytchOptions
)

export default function AuthLayout({ children }: PropsWithChildren) {
  logHydration('AuthLayout', 'init', { hasStytchClient: !!stytchClient });
  return <StytchProvider stytch={stytchClient}>{children}</StytchProvider>
}
