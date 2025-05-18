'use client'

import type { ReactNode } from 'react'
import { useStytchUser } from '@stytch/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LockClosedIcon } from '@radix-ui/react-icons'
import { useUserSubscription } from '@/app/subscription/SubscriptionStorage'
import { hasFeatureAccess } from '@/app/subscription/FeatureAccess'

interface FeatureGateProps {
  /**
   * The feature identifier that corresponds to a feature in FeatureAccess.ts
   */
  feature: string

  /**
   * The content to show when the user has access to the feature
   */
  children: ReactNode

  /**
   * Alternative content to show when the user doesn't have access to the feature
   * If not provided, a default upgrade card will be shown
   */
  fallback?: ReactNode

  /**
   * The URL to navigate to for upgrading (defaults to subscription home)
   */
  upgradeUrl?: string

  /**
   * Whether to allow unauthenticated users to see the feature
   * Defaults to false (unauthenticated users are prompted to sign in)
   */
  allowUnauthenticated?: boolean

  /**
   * Custom message to show when the feature is locked
   */
  lockedMessage?: string

  /**
   * Custom title for the upgrade card
   */
  upgradeTitle?: string
}

/**
 * FeatureGate component to restrict access to features based on subscription level
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  upgradeUrl = '/subscription/home',
  allowUnauthenticated = false,
  lockedMessage,
  upgradeTitle = 'Feature Upgrade Required',
}: FeatureGateProps) {
  const { user } = useStytchUser()
  const router = useRouter()
  const { subscription } = useUserSubscription()

  // If user is not authenticated and we don't allow unauthenticated access
  if (!user && !allowUnauthenticated) {
    return (
      <Card
        className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden"
        data-testid="feature-gate-auth-required"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Sign in or create an account to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            This feature requires an account. Please sign in or register to
            continue.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => router.push('/api/auth')}
            data-testid="feature-gate-signin-button"
          >
            Sign In / Register
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // For authenticated users, check subscription level
  if (user && subscription) {
    if (hasFeatureAccess(feature, subscription.tier)) {
      return <>{children}</>
    }
  }

  // If feature is not available or user has no subscription, show fallback or default upgrade card
  if (fallback) {
    return <>{fallback}</>
  }

  // Default upgrade card
  return (
    <Card
      className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden"
      data-testid="feature-gate-upgrade-required"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockClosedIcon className="w-5 h-5" />
          {upgradeTitle}
        </CardTitle>
        <CardDescription>
          A subscription upgrade is needed to access this feature
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80">
          {lockedMessage ||
            `This feature requires a different subscription plan. Please upgrade to access ${feature}.`}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => router.push(upgradeUrl)}
          data-testid="feature-gate-upgrade-button"
        >
          View Subscription Options
        </Button>
      </CardFooter>
    </Card>
  )
}
