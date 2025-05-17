'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trackFunnelPageVisit, clearFunnelData } from '../PlanStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircledIcon,
  ArrowRightIcon,
  LockClosedIcon,
  TimerIcon,
  FileTextIcon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons'

export default function SuccessPage() {
  const router = useRouter()

  // Track page visit and clear funnel data (completion)
  useEffect(() => {
    trackFunnelPageVisit('success')

    // Clear funnel data after 1 second to ensure tracking completes
    const timeout = setTimeout(() => {
      clearFunnelData()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="flex flex-col items-center" data-testid="success-container">
      {/* Header Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
          <CheckCircledIcon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Welcome to SafeIdea!
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-6">
          Your account has been created successfully. You're now ready to start
          protecting your intellectual property.
        </p>
      </section>

      {/* Next Steps Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Here's What Happens Next
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <EnvelopeClosedIcon className="w-6 h-6 text-primary" />
                <CardTitle>Check Your Email</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                We've sent a confirmation email to your inbox. Please click the
                verification link to activate your account and gain full access
                to all features.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LockClosedIcon className="w-6 h-6 text-primary" />
                <CardTitle>Set Up Your Account</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Complete your profile, set up two-factor authentication, and
                configure your account preferences for enhanced security and a
                personalized experience.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileTextIcon className="w-6 h-6 text-primary" />
                <CardTitle>Upload Your First Document</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Upload your first intellectual property document to create a
                secure, timestamped record. This establishes the foundation for
                your IP protection.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TimerIcon className="w-6 h-6 text-primary" />
                <CardTitle>Explore the Platform</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Take the interactive tour to discover all the features available
                in your plan. Learn how to maximize protection for your valuable
                intellectual property.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Account Information */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">
            Your Account Details
          </h2>

          <Card className="border border-border/30 mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Account Status:</span>
                  <span className="font-medium px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                    Free Trial Active
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Trial Period:</span>
                  <span className="font-medium">30 Days Remaining</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Selected Plan:</span>
                  <span className="font-medium">Secure Plan</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Storage Available:</span>
                  <span className="font-medium">15 GB</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">
                    Documents Protected:
                  </span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-sm text-foreground/80">
              You won't be charged until your trial ends on{' '}
              <span className="font-medium">June 16, 2025</span>.
            </p>
            <p className="text-sm text-foreground/80">
              You can cancel anytime before then with no obligation.
            </p>
          </div>
        </div>
      </section>

      {/* Helpful Resources */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-xl font-bold text-center mb-8">
          Helpful Resources
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border/30 bg-card/70 hover:bg-card/90 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <h3 className="font-medium mb-2">Quick Start Guide</h3>
              <p className="text-sm text-foreground/70">
                Essential tips for new users
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 hover:bg-card/90 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <h3 className="font-medium mb-2">Video Tutorials</h3>
              <p className="text-sm text-foreground/70">
                Step-by-step visual guides
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 hover:bg-card/90 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <h3 className="font-medium mb-2">Support Center</h3>
              <p className="text-sm text-foreground/70">
                Get help with questions
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 hover:bg-card/90 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <h3 className="font-medium mb-2">IP Protection Tips</h3>
              <p className="text-sm text-foreground/70">Best practices guide</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ready to Protect Your First Idea?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          Start by uploading your first document and creating a secure,
          timestamped record of your intellectual property.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/dashboard')}
            data-testid="dashboard-button"
          >
            Go to Dashboard
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/add-ip')}
            data-testid="add-ip-button"
          >
            Add First Document
          </Button>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 mb-8 text-center">
        <div className="border border-border/30 rounded-lg p-6 bg-card/30">
          <h3 className="text-lg font-medium mb-3">We'd Love Your Feedback</h3>
          <p className="text-foreground/80 mb-6 max-w-lg mx-auto">
            How was your signup experience? Your feedback helps us improve our
            service for all users.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm">
              Very Easy
            </Button>
            <Button variant="outline" size="sm">
              Easy
            </Button>
            <Button variant="outline" size="sm">
              Neutral
            </Button>
            <Button variant="outline" size="sm">
              Difficult
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
