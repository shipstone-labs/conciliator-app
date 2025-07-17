'use client'

import { useStytchUser } from '@stytch/nextjs'
import HomeApp from '@/components/home-app'
import LoggedOutHomeApp from '@/components/logged-out-home-app'

export default function Home() {
  const { user, isInitialized } = useStytchUser()

  // If not authenticated, show the logged-out home app experience
  if (isInitialized && !user) {
    return <LoggedOutHomeApp />
  }

  // If authenticated or still initializing, show the regular home app
  return <HomeApp />
}
