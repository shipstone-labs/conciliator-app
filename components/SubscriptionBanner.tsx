'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useStytchUser } from '@stytch/nextjs'
import { useUserSubscription } from '@/app/subscription/SubscriptionStorage'
import { Cross2Icon } from '@radix-ui/react-icons'
import { AuthButton } from './AuthButton'

interface SubscriptionBannerProps {
  /**
   * Feature that triggered this banner - corresponds to a feature in FeatureAccess.ts
   */
  feature?: string

  /**
   * Whether the banner is closable (can be dismissed)
   */
  closable?: boolean

  /**
   * URL to redirect to for upgrading (defaults to subscription home)
   */
  upgradeUrl?: string
}

/**
 * Component that displays a banner promoting subscription upgrades
 * based on the user's current subscription status
 */
export function SubscriptionBanner({
  feature,
  closable = true,
  upgradeUrl = '/subscription/home',
}: SubscriptionBannerProps) {
  const router = useRouter()
  const { user } = useStytchUser()
  const { subscription } = useUserSubscription()
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  // Get messaging based on subscription status
  let message = ''
  let buttonText = ''
  let buttonVariant: 'default' | 'secondary' | 'outline' = 'default'

  if (!user) {
    message =
      'Sign up to protect your intellectual property with our secure storage and sharing tools.'
    buttonText = 'Get Started'
    buttonVariant = 'default'
  } else if (!subscription || subscription.tier === 'none') {
    message = 'Select a subscription plan to access our IP protection features.'
    buttonText = 'See Plans'
    buttonVariant = 'default'
  } else if (
    subscription.tier === 'basic' &&
    feature &&
    (feature === 'share-ip' || feature === 'custom-nda')
  ) {
    message =
      'Upgrade to our Secure Plan to share your IP with controlled access and NDAs.'
    buttonText = 'Upgrade Now'
    buttonVariant = 'secondary'
  } else if (
    subscription.tier !== 'complete' &&
    feature &&
    feature === 'sales-agent'
  ) {
    message = 'Unlock our AI Sales Agent features with our Complete Plan.'
    buttonText = 'Upgrade to Complete'
    buttonVariant = 'secondary'
  } else {
    // Don't show banner if user has appropriate subscription
    return null
  }

  return (
    <div
      className="w-full bg-primary/10 border-b border-primary/20 py-2 px-4"
      data-testid="subscription-banner"
    >
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-foreground text-sm">{message}</p>
        <div className="flex items-center gap-2">
          {!user ? (
            <AuthButton
              text={buttonText}
              className="h-8 px-3 text-sm bg-primary hover:bg-primary/80 text-primary-foreground font-medium rounded-md"
            />
          ) : (
            <Button
              size="sm"
              variant={buttonVariant}
              onClick={() => router.push(upgradeUrl)}
              data-testid="subscription-banner-action"
            >
              {buttonText}
            </Button>
          )}

          {closable && (
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="ml-2 text-foreground/60 hover:text-foreground"
              aria-label="Close banner"
              data-testid="subscription-banner-close"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
