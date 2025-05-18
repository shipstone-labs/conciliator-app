'use client'

import { useRouter } from 'next/navigation'
import { trackFunnelPageVisit } from '../PlanStorage'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LockClosedIcon,
  Share2Icon,
  CheckIcon,
  ArrowRightIcon,
  ChatBubbleIcon,
  FileTextIcon,
  TimerIcon,
  IdCardIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons'

export default function HowItWorksPage() {
  const router = useRouter()

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('how-it-works')
  }, [])

  return (
    <div
      className="flex flex-col items-center"
      data-testid="how-it-works-container"
    >
      {/* Introduction Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-heading-gradient-from to-heading-gradient-to bg-clip-text text-transparent">
          How SafeIdea Works For You
        </h1>
        <p className="text-lg text-foreground/80 max-w-3xl mx-auto mb-8">
          SafeIdea provides a complete ecosystem for protecting your
          intellectual property at every stage—from initial documentation to
          secure sharing and monetization.
        </p>
      </section>

      {/* Process Overview Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-heading-gradient-from to-heading-gradient-to bg-clip-text text-transparent">
          The Protection Process
        </h2>

        <div className="relative">
          {/* Process timeline line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border mx-6 md:mx-0 hidden md:block" />

          {/* Step 1 */}
          <div
            className="flex flex-col md:flex-row items-start mb-16 relative"
            data-testid="process-step-1"
          >
            <div className="w-full md:w-1/2 md:pr-12 md:text-right order-2 md:order-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Document & Encrypt
              </h3>
              <p className="text-foreground/80 mb-4">
                Upload your ideas, documents, and intellectual property assets
                to our secure platform. We create an immutable timestamp proof
                of existence that can be verified at any time.
              </p>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <CheckIcon className="w-3 h-3 mr-1" /> Tamper-proof
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <LockClosedIcon className="w-3 h-3 mr-1" /> Encrypted
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <TimerIcon className="w-3 h-3 mr-1" /> Timestamped
                </span>
              </div>
            </div>
            <div className="md:w-14 flex items-center justify-center order-1 md:order-2 mb-4 md:mb-0">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center z-10">
                <span className="text-xl font-bold text-primary-foreground">
                  1
                </span>
              </div>
            </div>
            <div className="w-full md:w-1/2 md:pl-12 order-3">
              <div className="rounded-lg overflow-hidden border border-border bg-card/50 shadow-sm">
                <div className="p-1 bg-muted/50">
                  <img
                    src="/safeidea_cycle/1_protecting_ideas.png"
                    alt="Document and Encrypt Step"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="flex flex-col md:flex-row items-start mb-16 relative"
            data-testid="process-step-2"
          >
            <div className="w-full md:w-1/2 md:pr-12 order-2">
              <div className="rounded-lg overflow-hidden border border-border bg-card/50 shadow-sm">
                <div className="p-1 bg-muted/50">
                  <img
                    src="/safeidea_cycle/2_sharing_ideas.png"
                    alt="Secure Sharing Step"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="md:w-14 flex items-center justify-center order-1 md:order-2 mb-4 md:mb-0">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center z-10">
                <span className="text-xl font-bold text-secondary-foreground">
                  2
                </span>
              </div>
            </div>
            <div className="w-full md:w-1/2 md:pl-12 order-3 md:text-left">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Share Securely
              </h3>
              <p className="text-foreground/80 mb-4">
                Share your ideas with potential partners, investors, or team
                members under controlled conditions. Use our standard NDAs or
                your own customized NDAs to enforce agreements with timestamped
                proof of access.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                  <IdCardIcon className="w-3 h-3 mr-1" /> NDA Integration
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                  <EyeOpenIcon className="w-3 h-3 mr-1" /> Viewer Tracking
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                  <TimerIcon className="w-3 h-3 mr-1" /> Time-limited Access
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className="flex flex-col md:flex-row items-start relative"
            data-testid="process-step-3"
          >
            <div className="w-full md:w-1/2 md:pr-12 md:text-right order-2 md:order-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Monetize Your IP
              </h3>
              <p className="text-foreground/80 mb-4">
                Your ideas deserve to earn revenue. Our AI agents act like
                highly specialized salespeople for your intellectual property,
                connecting with potential buyers and licensing opportunities.
              </p>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <ChatBubbleIcon className="w-3 h-3 mr-1" /> AI-powered
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <FileTextIcon className="w-3 h-3 mr-1" /> Custom Terms
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <LightningBoltIcon className="w-3 h-3 mr-1" /> Automated
                </span>
              </div>
            </div>
            <div className="md:w-14 flex items-center justify-center order-1 md:order-2 mb-4 md:mb-0">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center z-10">
                <span className="text-xl font-bold text-accent-foreground">
                  3
                </span>
              </div>
            </div>
            <div className="w-full md:w-1/2 md:pl-12 order-3">
              <div className="rounded-lg overflow-hidden border border-border bg-card/50 shadow-sm">
                <div className="p-1 bg-muted/50">
                  <img
                    src="/safeidea_cycle/3_sales_agent.png"
                    alt="Monetize Step"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Key Protection Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LockClosedIcon className="w-6 h-6 text-primary" />
                <CardTitle>Immutable Timestamps</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 mb-4">
                Create unforgeable documentation of when your intellectual
                property was created and uploaded. This timestamp is permanently
                stored on decentralized infrastructure, making it impossible to
                tamper with.
              </p>
              <p className="text-foreground/80">
                <strong>Why it matters:</strong> In intellectual property
                disputes, proving who created something first is often the key
                to establishing ownership.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Share2Icon className="w-6 h-6 text-secondary" />
                <CardTitle>Enforceable NDAs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 mb-4">
                Our system records exactly when someone accessed your
                information and under what terms. This creates a clear chain of
                evidence if your intellectual property is misused.
              </p>
              <p className="text-foreground/80">
                <strong>Why it matters:</strong> Traditional NDAs are difficult
                to enforce without proof that someone actually had access to
                your information.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ChatBubbleIcon className="w-6 h-6 text-accent" />
                <CardTitle>AI Sales Agents</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 mb-4">
                Specialized AI agents trained specifically on your intellectual
                property can represent your ideas to potential buyers across the
                internet, working 24/7 to find opportunities.
              </p>
              <p className="text-foreground/80">
                <strong>Why it matters:</strong> Most creators don't have the
                time or resources to continuously market their intellectual
                property to the right audiences.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-destructive" />
                <CardTitle>Fraud Prevention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 mb-4">
                By establishing a clear timeline of creation and ownership,
                SafeIdea helps prevent others from claiming your work as their
                own.
              </p>
              <p className="text-foreground/80">
                <strong>Why it matters:</strong> In today's digital world, ideas
                can be copied instantly. Having verifiable proof of creation is
                essential for protecting your intellectual assets.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Common Questions */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Common Questions
        </h2>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6 bg-card/50">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              How is this different from a patent?
            </h3>
            <p className="text-foreground/80">
              Patents are government-granted monopolies that require public
              disclosure of your invention. SafeIdea complements patents by
              protecting trade secrets, early-stage ideas, and digital assets
              that may not qualify for patent protection, while maintaining
              confidentiality.
            </p>
          </div>

          <div className="border border-border rounded-lg p-6 bg-card/50">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Is my data secure?
            </h3>
            <p className="text-foreground/80">
              Absolutely. We use end-to-end encryption, meaning your data is
              encrypted before it leaves your device. Not even SafeIdea staff
              can access your unencrypted information without your explicit
              permission.
            </p>
          </div>

          <div className="border border-border rounded-lg p-6 bg-card/50">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              How do the AI agents work?
            </h3>
            <p className="text-foreground/80">
              Our AI agents are trained on your intellectual property documents
              and business preferences. They can engage with potential
              customers, explain your offering within the parameters you set,
              and facilitate introductions for more complex negotiations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ready to Discover the Right Protection Plan?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          Take our quick assessment to find the ideal protection level for your
          intellectual property needs.
        </p>

        <Button
          size="lg"
          onClick={() => router.push('/plan/assessment')}
          data-testid="how-it-works-cta"
        >
          Take the Assessment
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </section>
    </div>
  )
}
