'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStytchUser } from '@stytch/nextjs'
import { useRouter } from 'next/navigation'
import { useUserSubscription } from '@/app/subscription/SubscriptionStorage'
import { Badge } from '@/components/ui/badge'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AccountModal = ({ isOpen, onClose }: AccountModalProps) => {
  const router = useRouter()
  const { user } = useStytchUser()
  const { subscription, loading: subscriptionLoading } = useUserSubscription()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      // For now, we're getting the display name from local storage
      // In a production app, this would come from a database
      const savedName =
        localStorage.getItem(`user_displayname_${user.user_id}`) || ''
      setDisplayName(savedName)
    }
  }, [isOpen, user])

  // Identify the primary contact method (email or phone)
  const getUserContactInfo = () => {
    if (!user) return 'Not signed in'

    // Check for email
    if (user.emails && user.emails.length > 0) {
      return user.emails[0].email
    }

    // Check for phone
    if (user.phone_numbers && user.phone_numbers.length > 0) {
      return user.phone_numbers[0].phone_number
    }

    return 'Contact information not available'
  }

  // Format the subscription tier for display
  const formatSubscriptionTier = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'Basic'
      case 'secure':
        return 'Secure'
      case 'complete':
        return 'Complete'
      default:
        return 'No Subscription'
    }
  }

  // Format subscription status
  const formatSubscriptionStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'cancelled':
        return 'Cancelled'
      case 'expired':
        return 'Expired'
      default:
        return 'Unknown'
    }
  }

  // Get badge color based on subscription tier
  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'bg-primary/20 text-primary border-primary/30'
      case 'secure':
        return 'bg-secondary/20 text-secondary border-secondary/30'
      case 'complete':
        return 'bg-accent/20 text-accent border-accent/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30'
    }
  }

  // Handle saving changes
  const handleSave = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Save display name to local storage for demo purposes
      // In a production app, this would be saved to a database
      localStorage.setItem(`user_displayname_${user.user_id}`, displayName)

      // Show success message briefly
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError('Failed to save changes')
      console.error('Error saving user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Format date to human-readable format
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings">
      <div className="space-y-6 py-4">
        {error && (
          <Alert
            variant="destructive"
            className="bg-red-500/10 border-red-500/30"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <AlertDescription>Changes saved successfully</AlertDescription>
          </Alert>
        )}

        {/* Subscription Information Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-foreground/90">
              Subscription
            </p>
            <Button
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={() => {
                onClose()
                router.push('/subscription/home')
              }}
              data-testid="manage-subscription-link"
            >
              Manage Subscription
            </Button>
          </div>

          <div className="p-3 bg-muted/30 rounded-md border border-border/40 space-y-3">
            {subscriptionLoading ? (
              <div className="animate-pulse h-5 bg-muted/50 rounded w-1/3" />
            ) : subscription && subscription.tier !== 'none' ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>Plan:</span>
                    <Badge
                      className={getSubscriptionBadgeColor(subscription.tier)}
                      data-testid="subscription-tier-badge"
                    >
                      {formatSubscriptionTier(subscription.tier)}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      subscription.status === 'active' ? 'default' : 'outline'
                    }
                    className={
                      subscription.status === 'active'
                        ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30'
                        : 'text-muted-foreground'
                    }
                    data-testid="subscription-status-badge"
                  >
                    {formatSubscriptionStatus(subscription.status)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Started: {formatDate(subscription.startDate)}</div>
                  {subscription.endDate && (
                    <div>
                      {subscription.status === 'cancelled'
                        ? 'Access until'
                        : 'Expires'}
                      : {formatDate(subscription.endDate)}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <span>No active subscription</span>
                <Button
                  size="sm"
                  onClick={() => {
                    onClose()
                    router.push('/subscription/home')
                  }}
                  data-testid="start-subscription-button"
                >
                  Start Subscription
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="contact"
            className="text-sm font-medium text-foreground/90"
          >
            Contact Information
          </label>
          <div
            id="contact"
            className="p-3 bg-muted/30 rounded-md border border-border/40"
          >
            {getUserContactInfo()}
          </div>
          <p className="text-xs text-muted-foreground">
            This is the contact method you used to sign in. It is not shown to
            other users.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="display-name"
            className="text-sm font-medium text-foreground/90"
          >
            Display Name (Optional)
          </label>
          <Input
            id="display-name"
            placeholder="Enter a display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            className="border-border/40 bg-muted/30"
          />
          <p className="text-xs text-muted-foreground">
            This name is optional and not shown to other users.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
