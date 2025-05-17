'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackFunnelPageVisit, getRecommendedPlan } from '../PlanStorage'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckIcon,
  Cross2Icon,
  QuestionMarkCircledIcon,
  ArrowRightIcon,
  InfoCircledIcon,
  LockClosedIcon,
  Share2Icon,
  GlobeIcon,
} from '@radix-ui/react-icons'

// Plan details
const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9/month',
    description:
      'Essential protection for solo creators with documentation needs',
    icon: <LockClosedIcon className="w-6 h-6 text-primary" />,
    features: {
      encryption: true,
      timestamp: true,
      storage: '5GB',
      sharing: 'Limited',
      nda: false,
      monitoring: false,
      ai: false,
      support: 'Email',
    },
    idealFor: 'Solo creators looking to establish idea provenance',
    color: 'primary',
    tagline: 'Secure Documentation',
  },
  {
    id: 'secure',
    name: 'Secure',
    price: '$19/month',
    description:
      'Enhanced protection with controlled sharing and NDA integration',
    icon: <Share2Icon className="w-6 h-6 text-secondary" />,
    features: {
      encryption: true,
      timestamp: true,
      storage: '15GB',
      sharing: 'Unlimited',
      nda: true,
      monitoring: false,
      ai: false,
      support: 'Email + Chat',
    },
    idealFor: 'Teams and businesses sharing IP with partners',
    color: 'secondary',
    tagline: 'Most Popular',
    recommended: true,
  },
  {
    id: 'complete',
    name: 'Complete',
    price: '$29/month',
    description:
      'Comprehensive protection with monitoring and AI-powered assistance',
    icon: <GlobeIcon className="w-6 h-6 text-accent" />,
    features: {
      encryption: true,
      timestamp: true,
      storage: '50GB',
      sharing: 'Unlimited',
      nda: true,
      monitoring: true,
      ai: true,
      support: 'Priority',
    },
    idealFor: 'Businesses with valuable IP requiring continuous protection',
    color: 'accent',
    tagline: 'Full Protection',
  },
]

// Feature descriptions for the table
const FEATURE_INFO = {
  encryption: {
    name: 'End-to-End Encryption',
    description:
      'Military-grade encryption for all your intellectual property documents',
  },
  timestamp: {
    name: 'Immutable Timestamps',
    description:
      'Cryptographic proof of existence that can be verified in court',
  },
  storage: {
    name: 'Secure Storage',
    description:
      'Encrypted storage space for your documents and associated files',
  },
  sharing: {
    name: 'Controlled Sharing',
    description:
      'Share your ideas with specific individuals under controlled conditions',
  },
  nda: {
    name: 'NDA Integration',
    description: 'Automatic NDA creation and tracking with digital signatures',
  },
  monitoring: {
    name: 'IP Monitoring',
    description:
      'Automated scanning for unauthorized use of your intellectual property',
  },
  ai: {
    name: 'AI Sales Agent',
    description:
      'AI-powered agent that can represent and promote your IP to potential buyers',
  },
  support: {
    name: 'Customer Support',
    description:
      'Access to our customer support team for any questions or issues',
  },
}

export default function PlansPage() {
  const router = useRouter()
  const [recommendedPlan, setRecommendedPlan] = useState<string>('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Track page visit and load recommended plan
  useEffect(() => {
    trackFunnelPageVisit('plans')
    setRecommendedPlan(getRecommendedPlan())
  }, [])

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    router.push(`/plan/${planId}`)
  }

  return (
    <div className="flex flex-col items-center" data-testid="plans-container">
      {/* Header Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Choose Your IP Protection Plan
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-6">
          Select the plan that best fits your intellectual property needs and
          business goals.
        </p>

        {/* View mode toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            onClick={() => setViewMode('cards')}
            size="sm"
            data-testid="cards-view-button"
          >
            Card View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
            size="sm"
            data-testid="table-view-button"
          >
            Comparison Table
          </Button>
        </div>
      </section>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <section className="w-full max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isRecommended =
                recommendedPlan === plan.id ||
                (!recommendedPlan && plan.recommended)

              return (
                <Card
                  key={plan.id}
                  className={`border ${
                    isRecommended
                      ? `border-${plan.color} shadow-lg relative`
                      : 'border-border/30'
                  } bg-card/70 backdrop-blur-lg overflow-hidden flex flex-col`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Recommended
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div
                          className={`text-sm font-medium text-${plan.color} mb-1`}
                        >
                          {plan.tagline}
                        </div>
                        <CardTitle className="text-xl">
                          {plan.name} Plan
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {plan.description}
                        </CardDescription>
                      </div>
                      <div className={`p-2 rounded-full bg-${plan.color}/10`}>
                        {plan.icon}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-2xl font-bold mb-4">{plan.price}</div>
                    <div className="space-y-3">
                      {Object.entries(plan.features)
                        .slice(0, 5)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-start">
                            <div className="mr-2 mt-0.5">
                              {value === true ? (
                                <CheckIcon
                                  className={`h-4 w-4 text-${plan.color}`}
                                />
                              ) : value === false ? (
                                <Cross2Icon className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <span
                                  className={`text-xs font-medium text-${plan.color}`}
                                >
                                  {value}
                                </span>
                              )}
                            </div>
                            <div className="text-sm">
                              {
                                FEATURE_INFO[key as keyof typeof FEATURE_INFO]
                                  .name
                              }
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 text-sm text-foreground/70">
                      <span className="font-medium">Ideal for:</span>{' '}
                      {plan.idealFor}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                      data-testid={`select-plan-${plan.id}`}
                      variant={isRecommended ? 'default' : 'outline'}
                    >
                      Select {plan.name} Plan
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <section className="w-full max-w-5xl mx-auto px-4 py-8 overflow-x-auto">
          <div className="min-w-[768px]">
            <Table className="border border-border/30 rounded-lg overflow-hidden">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[250px]">Features</TableHead>
                  {PLANS.map((plan) => (
                    <TableHead
                      key={plan.id}
                      className={`text-center ${
                        recommendedPlan === plan.id ||
                        (!recommendedPlan && plan.recommended)
                          ? `bg-${plan.color}/10 font-medium`
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-sm text-${plan.color} mb-1`}>
                          {plan.tagline}
                        </span>
                        <span className="font-bold">{plan.name}</span>
                        <span className="text-lg font-bold mt-1">
                          {plan.price}
                        </span>
                        {(recommendedPlan === plan.id ||
                          (!recommendedPlan && plan.recommended)) && (
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full mt-1">
                            Recommended
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(FEATURE_INFO).map(([key, info]) => (
                  <TableRow key={key} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span>{info.name}</span>
                        <QuestionMarkCircledIcon
                          className="ml-1 h-4 w-4 text-muted-foreground cursor-help"
                          aria-label={info.description}
                        />
                      </div>
                    </TableCell>
                    {PLANS.map((plan) => {
                      const value =
                        plan.features[key as keyof typeof plan.features]
                      return (
                        <TableCell
                          key={`${plan.id}-${key}`}
                          className="text-center"
                        >
                          {value === true ? (
                            <CheckIcon
                              className={`h-5 w-5 text-${plan.color} mx-auto`}
                            />
                          ) : value === false ? (
                            <Cross2Icon className="h-5 w-5 text-muted-foreground mx-auto" />
                          ) : (
                            <span
                              className={`text-sm font-medium text-${plan.color}`}
                            >
                              {value}
                            </span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/10">
                  <TableCell className="font-medium">Actions</TableCell>
                  {PLANS.map((plan) => (
                    <TableCell
                      key={`${plan.id}-action`}
                      className="text-center p-4"
                    >
                      <Button
                        onClick={() => handleSelectPlan(plan.id)}
                        data-testid={`table-select-plan-${plan.id}`}
                        variant={
                          recommendedPlan === plan.id ||
                          (!recommendedPlan && plan.recommended)
                            ? 'default'
                            : 'outline'
                        }
                        className="w-full"
                      >
                        Select Plan
                      </Button>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 mt-8">
        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4" />
              Can I change plans later?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              take effect at the start of your next billing cycle.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4" />
              Is there a free trial?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              We offer a 30-day money-back guarantee on all plans. If you're not
              satisfied, contact our support team for a full refund.
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-medium flex items-center">
              <QuestionMarkCircledIcon className="mr-2 h-4 w-4" />
              What happens when I reach my storage limit?
            </h3>
            <p className="mt-2 text-sm text-foreground/80">
              You'll receive a notification when you reach 80% of your storage
              limit. You can upgrade your plan or manage your existing storage.
            </p>
          </div>

          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/plan/faq')}
              data-testid="view-all-faqs"
            >
              View All FAQs
              <InfoCircledIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-16 text-center border-t border-border/30 mt-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Ready to Protect Your Intellectual Property?
        </h2>
        <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
          Start securing your ideas today with our risk-free trial. Cancel
          anytime during the first 30 days for a full refund.
        </p>

        <Button
          size="lg"
          onClick={() => handleSelectPlan(recommendedPlan || 'secure')}
          data-testid="final-cta"
        >
          Get Started Now
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </section>
    </div>
  )
}
