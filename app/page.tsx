'use client'

import { useStytchUser } from '@stytch/nextjs'
import HomeApp from '@/components/home-app'
import SubscriptionHome from '@/app/subscription/home/page'

export default function Home() {
  const { user, isInitialized } = useStytchUser()

  // If not authenticated, show subscription home page
  if (isInitialized && !user) {
    return <SubscriptionHome />
  }

  // If authenticated or still initializing, show the regular home app
  return <HomeApp />
}
