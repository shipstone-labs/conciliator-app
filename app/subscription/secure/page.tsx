'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trackFunnelPageVisit } from '../SubscriptionStorage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  Share2Icon,
  QuestionMarkCircledIcon,
  IdCardIcon,
  EyeOpenIcon,
  ChatBubbleIcon,
} from '@radix-ui/react-icons'

export default function SecurePlanPage() {
  const router = useRouter()

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('secure-plan')
  }, [])

  // Handle signup
  const handleSignup = () => {
    router.push('/subscription/signup?plan=secure')
  }

  return (
    <div
      className="flex flex-col items-center"
      data-testid="secure-plan-container"
    >
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-12">
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-secondary/10 mb-4">
            <Share2Icon className="w-6 h-6 text-secondary" />
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-full mb-4">
            Most Popular
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          Secure IP Protection Plan
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Enhanced protection with controlled sharing and NDA integration for
          teams and businesses.
        </p>
        <div className="text-3xl font-bold mb-6 pricing-blur">$19/month</div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            data-testid="primary-signup-button"
          >
            Start Secure Plan
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/subscription/plans')}
            data-testid="back-to-plans-button"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Compare Plans
          </Button>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          What's Included in the Secure Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Share2Icon className="w-6 h-6 text-secondary" />
                <CardTitle>Unlimited Controlled Sharing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Share your intellectual property with as many recipients as you
                need, while maintaining complete control over access
                permissions, expiration dates, and download restrictions.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IdCardIcon className="w-6 h-6 text-secondary" />
                <CardTitle>NDA Integration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Automatically require legally-binding non-disclosure agreements
                before allowing access to your intellectual property. Track
                agreement acceptance with timestamps and digital signatures.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <EyeOpenIcon className="w-6 h-6 text-secondary" />
                <CardTitle>Activity Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Monitor who views your documents, when they access them, and
                what actions they take. Receive notifications when important
                activities occur, maintaining a complete audit trail.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ChatBubbleIcon className="w-6 h-6 text-secondary" />
                <CardTitle>Priority Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Get faster assistance with email and chat support from our
                intellectual property specialists. Enjoy shorter response times
                and priority issue resolution.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature List Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <h2 className="text-xl font-bold text-center mb-8">
          All Secure Plan Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-2xl mx-auto">
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>End-to-end encryption for all documents</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Immutable timestamps for provenance</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>15GB secure document storage</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Unlimited sharing with access controls</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Automated NDA generation and tracking</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Email & chat support (12-24 hour response)</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Up to 50 documents</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Advanced document versioning</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>View and download analytics</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Customizable access expiration</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Watermarking capabilities</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-secondary mr-2 mt-0.5" />
            <span>Team collaboration features</span>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          Who the Secure Plan is For
        </h2>

        <div className="space-y-6">
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Startups & Small Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Perfect for startups and businesses that need to share
                intellectual property with potential investors, partners, or
                team members. The Secure plan provides the controls and legal
                protections you need when involving others in your intellectual
                property development.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Collaborative Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Ideal for teams working together on intellectual property assets
                that require careful sharing and access management. Control who
                can view, edit, or download your documents while maintaining a
                clear record of all activities.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Consultants & Freelancers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Great for professionals who need to share confidential work with
                clients while protecting their intellectual property. The NDA
                integration ensures your work is legally protected when sharing
                with clients, agencies, or other stakeholders.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison with Basic Plan */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <h2 className="text-xl font-bold text-center mb-8">
          Why Upgrade from Basic to Secure?
        </h2>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-secondary">Secure:</span> Unlimited Sharing
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                Share with unlimited recipients, each with custom access
                controls
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Basic:</span> Limited to 3
              recipients
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-secondary">Secure:</span> NDA Integration
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                Legally-binding NDAs with digital signatures and tracking
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Basic:</span> No NDA
              capabilities
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-secondary">Secure:</span> 15GB Storage
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                Triple the storage space for all your IP documentation
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Basic:</span> 5GB Storage
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-secondary">Secure:</span> Activity Tracking
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                Detailed audit logs of all views, downloads, and access attempts
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Basic:</span> Limited
              tracking
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-secondary" />
              How does the NDA integration work?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              When you share a document, you can require the recipient to sign
              an NDA before gaining access. We provide customizable NDA
              templates that you can adjust to your needs. Recipients will be
              prompted to sign digitally, and the agreement is timestamped and
              stored securely.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-secondary" />
              Can I customize access permissions for different recipients?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Yes, you have fine-grained control over each recipient's
              permissions. You can set view-only access, allow downloads, set
              expiration dates, require watermarking, limit the number of views,
              and more, individually for each person you share with.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-secondary" />
              How many team members can I add to my account?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              The Secure plan includes up to 5 team members who can collaborate
              on your intellectual property. Each team member gets their own
              login and access controls. Additional team members can be added
              for $3/month per person.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-secondary" />
              Are the NDAs legally binding?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Yes, our NDAs are drafted by intellectual property attorneys and
              are legally binding in most jurisdictions. We use digital
              signature technology that complies with e-signature laws, and we
              maintain comprehensive timestamp records of agreement acceptance.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          Ready to Securely Share Your Intellectual Property?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          The Secure plan gives you the perfect balance of protection and
          collaboration capabilities for your intellectual property. Start
          safely sharing your ideas today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            data-testid="cta-signup-button"
          >
            Get Started with Secure Plan
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/subscription/plans')}
            data-testid="cta-compare-button"
          >
            Compare All Plans
          </Button>
        </div>

        <p className="mt-6 text-sm text-foreground/60">
          30-day money-back guarantee. No long-term contracts. Cancel anytime.
        </p>
      </section>
    </div>
  )
}
