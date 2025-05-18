'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { FeatureGate } from '@/components/FeatureGating'
import { SubscriptionBanner } from '@/components/SubscriptionBanner'
import { useStytchUser } from '@stytch/nextjs'
import {
  useUserSubscription,
  setUserSubscription,
} from '@/app/subscription/SubscriptionStorage'
import type { SubscriptionTier } from '@/app/subscription/FeatureAccess'

/**
 * Test page for subscription features
 */
export default function SubscriptionTestPage() {
  const router = useRouter()
  const { user } = useStytchUser()
  const { subscription, loading } = useUserSubscription()
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('basic')
  const [status, setStatus] = useState<'active' | 'cancelled' | 'expired'>(
    'active'
  )
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>('')
  const [saveMessage, setSaveMessage] = useState('')

  // Handle updating the user's subscription
  const handleUpdateSubscription = async () => {
    if (!user) {
      setSaveMessage('User must be authenticated to set subscription')
      return
    }

    try {
      const success = await setUserSubscription(user.user_id, {
        tier: selectedTier,
        status,
        startDate: new Date(startDate).getTime(),
        endDate: endDate ? new Date(endDate).getTime() : null,
        paymentMethod: 'test',
      })

      if (success) {
        setSaveMessage('Subscription updated successfully')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Failed to update subscription')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      setSaveMessage('Error updating subscription')
    }
  }

  // Format the subscription object for display
  const formatSubscription = (sub: any) => {
    if (!sub) return 'No subscription data'

    return JSON.stringify(
      {
        tier: sub.tier,
        status: sub.status,
        startDate: new Date(sub.startDate).toLocaleDateString(),
        endDate: sub.endDate
          ? new Date(sub.endDate).toLocaleDateString()
          : null,
        paymentMethod: sub.paymentMethod,
      },
      null,
      2
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <SubscriptionBanner closable={false} />

      <Card>
        <CardHeader>
          <CardTitle>Subscription Feature Testing</CardTitle>
          <CardDescription>
            Test the subscription features and components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="feature-gating">
            <TabsList className="mb-4">
              <TabsTrigger value="feature-gating">Feature Gating</TabsTrigger>
              <TabsTrigger value="subscription-data">
                Subscription Data
              </TabsTrigger>
              <TabsTrigger value="manage-subscription">
                Manage Subscription
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feature-gating" className="space-y-6">
              <h3 className="text-lg font-medium">
                Feature Gating Component Test
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Feature */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Add IP Feature (Basic+)</CardTitle>
                    <CardDescription>
                      Available to Basic, Secure, and Complete tiers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeatureGate feature="add-ip">
                      <div className="bg-primary/10 border border-primary/30 rounded-md p-4 text-center">
                        <p>You have access to Add IP feature!</p>
                      </div>
                    </FeatureGate>
                  </CardContent>
                </Card>

                {/* Secure Feature */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Share IP Feature (Secure+)</CardTitle>
                    <CardDescription>
                      Available to Secure and Complete tiers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeatureGate
                      feature="share-ip"
                      lockedMessage="Upgrade to Secure or Complete plan to share your intellectual property with partners."
                    >
                      <div className="bg-secondary/10 border border-secondary/30 rounded-md p-4 text-center">
                        <p>You have access to Share IP feature!</p>
                      </div>
                    </FeatureGate>
                  </CardContent>
                </Card>

                {/* Complete Feature */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Sales Agent (Complete Only)</CardTitle>
                    <CardDescription>
                      Available only to Complete tier
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeatureGate
                      feature="sales-agent"
                      lockedMessage="Upgrade to our Complete plan to access AI Sales Agent capabilities."
                    >
                      <div className="bg-accent/10 border border-accent/30 rounded-md p-4 text-center">
                        <p>You have access to Sales Agent feature!</p>
                      </div>
                    </FeatureGate>
                  </CardContent>
                </Card>

                {/* Custom Fallback */}
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Custom Fallback Example</CardTitle>
                    <CardDescription>
                      Shows custom fallback content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeatureGate
                      feature="ip-monitoring"
                      fallback={
                        <div className="bg-muted p-4 rounded-md border border-border">
                          <h4 className="font-medium mb-2">
                            IP Monitoring Preview
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            This is a custom fallback that shows a preview of
                            the IP Monitoring feature.
                          </p>
                          <Button size="sm" variant="outline">
                            Upgrade to Access
                          </Button>
                        </div>
                      }
                    >
                      <div className="bg-accent/10 border border-accent/30 rounded-md p-4 text-center">
                        <p>You have access to IP Monitoring feature!</p>
                      </div>
                    </FeatureGate>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscription-data">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Current Subscription Data
                </h3>
                {loading ? (
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent" />
                    <span>Loading subscription data...</span>
                  </div>
                ) : (
                  <pre className="bg-muted/30 p-4 rounded-md overflow-x-auto border border-border whitespace-pre-wrap">
                    {user
                      ? formatSubscription(subscription)
                      : 'User not authenticated'}
                  </pre>
                )}

                <div className="flex items-center space-x-4">
                  <div className="font-medium">User Status:</div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-muted/30">
                    {user ? 'Authenticated' : 'Not Authenticated'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manage-subscription" className="space-y-6">
              <h3 className="text-lg font-medium">Manage Test Subscription</h3>

              {!user ? (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-md text-amber-700 dark:text-amber-300">
                  You must be logged in to manage subscription settings.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription-tier">
                        Subscription Tier
                      </Label>
                      <select
                        id="subscription-tier"
                        className="w-full px-3 py-2 bg-muted/30 border border-border rounded-md"
                        value={selectedTier}
                        onChange={(e) =>
                          setSelectedTier(e.target.value as SubscriptionTier)
                        }
                      >
                        <option value="none">None</option>
                        <option value="basic">Basic</option>
                        <option value="secure">Secure</option>
                        <option value="complete">Complete</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscription-status">Status</Label>
                      <select
                        id="subscription-status"
                        className="w-full px-3 py-2 bg-muted/30 border border-border rounded-md"
                        value={status}
                        onChange={(e) =>
                          setStatus(
                            e.target.value as 'active' | 'cancelled' | 'expired'
                          )
                        }
                      >
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        className="bg-muted/30 border-border"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date (Optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        className="bg-muted/30 border-border"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={handleUpdateSubscription}>
                    Update Subscription
                  </Button>

                  {saveMessage && (
                    <div
                      className={`p-3 rounded-md ${
                        saveMessage.includes('success')
                          ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300'
                          : 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {saveMessage}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={() => router.push('/subscription/home')}>
            View Subscription Plans
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
