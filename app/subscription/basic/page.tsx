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
  LockClosedIcon,
  TimerIcon,
  EnvelopeClosedIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'

export default function BasicPlanPage() {
  const router = useRouter()

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('basic-plan')
  }, [])

  // Handle signup
  const handleSignup = () => {
    router.push('/subscription/signup?plan=basic')
  }

  return (
    <div
      className="flex flex-col items-center"
      data-testid="basic-plan-container"
    >
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-12">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-6">
          <LockClosedIcon className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Basic IP Protection Plan
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Essential protection for establishing and securing your intellectual
          property.
        </p>
        <div className="text-3xl font-bold mb-6">$9/month</div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            data-testid="primary-signup-button"
          >
            Start Basic Plan
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
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          What's Included in the Basic Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LockClosedIcon className="w-6 h-6 text-primary" />
                <CardTitle>End-to-End Encryption</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Military-grade encryption keeps your intellectual property
                completely private. All documents are encrypted before they
                leave your device, ensuring only you can access them.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TimerIcon className="w-6 h-6 text-primary" />
                <CardTitle>Immutable Timestamps</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Create legally-defensible proof of when you created your
                intellectual property. Our timestamps are cryptographically
                secured and can be independently verified.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <EnvelopeClosedIcon className="w-6 h-6 text-primary" />
                <CardTitle>5GB Secure Storage</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Store your documents, designs, code, and other intellectual
                property assets in our secure cloud storage. All files remain
                encrypted and are backed up redundantly.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <EnvelopeClosedIcon className="w-6 h-6 text-primary" />
                <CardTitle>Email Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Get help when you need it with our responsive email support
                team. We're here to help you protect your intellectual property
                and make the most of our platform.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature List Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <h2 className="text-xl font-bold text-center mb-8">
          All Basic Plan Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-2xl mx-auto">
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>End-to-end encryption for all documents</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>Immutable timestamps for provenance</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>5GB secure document storage</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>Limited sharing capabilities (up to 3 recipients)</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>Basic document versioning</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>Email support (24-48 hour response time)</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>Up to 10 documents</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
            <span>Access to basic documentation guides</span>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Who the Basic Plan is For
        </h2>

        <div className="space-y-6">
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Solo Creators & Inventors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Perfect for individual creators looking to establish a clear
                timeline of creation for their intellectual property. Whether
                you're writing a book, creating designs, or developing a new
                invention, the Basic plan helps you prove when you created your
                work.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Early-Stage Development</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Ideal for projects in the early stages of development where you
                need to establish a timeline of innovation before seeking
                patents or sharing with potential partners. Get your
                documentation in order before moving to more formal protection.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Students & Researchers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Great for academic work where establishing priority and proving
                original research is critical. Document your findings and
                innovations with timestamps that can help establish your
                contribution to your field.
              </p>
            </CardContent>
          </Card>
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
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-primary" />
              Can I upgrade to a higher plan later?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Yes, you can upgrade to the Secure or Complete plan at any time.
              Your documents and timestamps will transfer seamlessly, and you'll
              gain access to additional features immediately.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-primary" />
              What happens if I need more storage?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              The Basic plan includes 5GB of storage. If you need more, you can
              either upgrade to a higher plan or purchase additional storage in
              5GB increments for $2/month each.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-primary" />
              Are there any limits on document types?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              No, you can upload a wide variety of file formats including PDFs,
              images, text documents, spreadsheets, code files, CAD files, and
              more. There is a 100MB file size limit per document.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-primary" />
              How do I share documents with the Basic plan?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              The Basic plan allows you to share documents with up to 3
              recipients. Simply select the document, enter the recipient's
              email, and they'll receive a secure link to view the document.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ready to Secure Your Intellectual Property?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          The Basic plan is perfect for establishing secure documentation and
          provenance for your intellectual property. Start protecting your ideas
          today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            data-testid="cta-signup-button"
          >
            Get Started with Basic Plan
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
