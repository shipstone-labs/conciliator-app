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
  GlobeIcon,
  QuestionMarkCircledIcon,
  ChatBubbleIcon,
  MagnifyingGlassIcon,
  LightningBoltIcon,
  BellIcon,
} from '@radix-ui/react-icons'

export default function CompletePlanPage() {
  const router = useRouter()

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('complete-plan')
  }, [])

  // Handle signup
  const handleSignup = () => {
    router.push('/subscription/signup?plan=complete')
  }

  return (
    <div
      className="flex flex-col items-center"
      data-testid="complete-plan-container"
    >
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-12">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent/10 mb-6">
          <GlobeIcon className="w-6 h-6 text-accent" />
        </div>
        <span className="inline-flex items-center px-3 py-1 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
          Full Protection
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Complete IP Protection Plan
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Comprehensive protection with monitoring, AI-powered assistance, and
          advanced security features.
        </p>
        <div className="text-3xl font-bold mb-6">$29/month</div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            data-testid="primary-signup-button"
          >
            Start Complete Plan
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
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          What's Included in the Complete Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MagnifyingGlassIcon className="w-6 h-6 text-accent" />
                <CardTitle>IP Monitoring & Infringement Detection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Our system continuously scans the web for unauthorized use of
                your intellectual property, identifying potential infringements
                and providing quarterly reports to keep you informed of any
                issues.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ChatBubbleIcon className="w-6 h-6 text-accent" />
                <CardTitle>AI Sales Agent</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Our specialized AI agents work 24/7 to represent your
                intellectual property to potential licensees and buyers,
                increasing exposure and monetization opportunities while
                operating within your parameters.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BellIcon className="w-6 h-6 text-accent" />
                <CardTitle>Real-time Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Receive instant notifications about important activities related
                to your intellectual property, such as unauthorized access
                attempts, potential infringements, sharing activity, and
                licensing opportunities.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LightningBoltIcon className="w-6 h-6 text-accent" />
                <CardTitle>Priority Support & Consulting</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Get VIP access to our intellectual property specialists with
                priority support channels and quarterly consultation sessions to
                help optimize your IP protection and monetization strategy.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature List Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <h2 className="text-xl font-bold text-center mb-8">
          All Complete Plan Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-2xl mx-auto">
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>End-to-end encryption for all documents</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Immutable timestamps for provenance</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>50GB secure document storage</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Unlimited sharing with advanced controls</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Automated NDA generation and tracking</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Priority support (4-8 hour response)</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Unlimited documents</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Web monitoring for infringement</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>AI-powered sales agent</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Quarterly infringement reports</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Unlimited team members</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Quarterly IP strategy consultation</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Custom integration options</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Custom watermarking & tracking</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Dedicated account manager</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="w-5 h-5 text-accent mr-2 mt-0.5" />
            <span>Real-time access alerts</span>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="text-2xl font-bold text-center mb-10 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Who the Complete Plan is For
        </h2>

        <div className="space-y-6">
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Established Businesses & IP Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Perfect for businesses with significant intellectual property
                assets that need comprehensive protection and monitoring. The
                Complete plan provides advanced security, monitoring, and
                monetization features for organizations that see their IP as a
                core business asset.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>High-Value IP Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Ideal for protecting intellectual property of exceptional value,
                where monitoring for unauthorized use and infringement is
                critical. The Complete plan's monitoring capabilities help
                identify potential IP theft and misuse across the web and
                digital marketplaces.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>IP Monetization Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">
                Perfect for creators and organizations looking to generate
                revenue from their intellectual property through licensing,
                sales, or partnerships. The AI sales agent actively works to
                identify monetization opportunities and represent your IP to
                potential buyers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison with Secure Plan */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 bg-card/30 border-y border-border">
        <h2 className="text-xl font-bold text-center mb-8">
          Why Upgrade from Secure to Complete?
        </h2>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-accent">Complete:</span> IP Monitoring
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                Automated scanning for unauthorized use of your IP across the
                web
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Secure:</span> No monitoring
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-accent">Complete:</span> AI Sales Agent
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                AI-powered agent that actively promotes your IP to potential
                buyers
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Secure:</span> No AI agent
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-accent">Complete:</span> 50GB Storage
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                More than 3x the storage of the Secure plan for all your IP
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Secure:</span> 15GB Storage
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-1/3 pr-6 font-medium text-right">
              <span className="text-accent">Complete:</span> Strategy
              Consultation
            </div>
            <div className="flex-grow border-l border-border pl-6 pb-4">
              <p className="text-sm text-foreground/80">
                Quarterly sessions with IP specialists to optimize your strategy
              </p>
            </div>
            <div className="flex-shrink-0 w-1/3 pl-6 text-muted-foreground">
              <span className="text-foreground/60">Secure:</span> Standard
              support only
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
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-accent" />
              How does the IP monitoring work?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Our system uses advanced AI and web crawling technology to scan
              the internet for content similar to your protected intellectual
              property. It analyzes websites, marketplaces, repositories, and
              other digital platforms to identify potential unauthorized use.
              You'll receive real-time alerts for significant matches and
              quarterly comprehensive reports.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-accent" />
              Can I control how the AI agent represents my intellectual
              property?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Yes, you have complete control over the AI sales agent. You can
              define parameters including pricing requirements, potential use
              cases, target industries, conversation boundaries, and
              presentation style. You can also review and approve all leads
              before direct contact is made.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-accent" />
              What's included in the quarterly strategy consultation?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Each quarter, you'll have a one-hour session with an intellectual
              property specialist who will review your current protection
              strategy, analyze any detected infringements, assess monetization
              opportunities, and provide recommendations for optimizing your IP
              portfolio management.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4 text-accent" />
              What happens if infringement is detected?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              When our system detects potential infringement, you'll receive an
              immediate alert with details including the source, type of
              infringement, and evidence. Our team will help you assess the
              severity and recommend next steps, which may include contacting
              the infringing party, issuing takedown notices, or consulting
              legal counsel.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Ready for Comprehensive IP Protection?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          The Complete plan offers the ultimate protection for your valuable
          intellectual property, with monitoring, monetization, and expert
          assistance all included.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            data-testid="cta-signup-button"
          >
            Get Started with Complete Plan
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
