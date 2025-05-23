'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  trackFunnelPageVisit,
  getRecommendedPlan,
} from '../SubscriptionStorage'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  Share2Icon,
  GlobeIcon,
} from '@radix-ui/react-icons'

// Plan details for display
const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: '$9/month',
    description: 'Essential protection for establishing IP ownership',
    icon: <LockClosedIcon className="w-6 h-6 text-primary" />,
    features: [
      'End-to-end encryption',
      'Immutable timestamps',
      '5GB secure storage',
      'Limited sharing capabilities',
      'Email support',
    ],
    color: 'primary',
  },
  secure: {
    id: 'secure',
    name: 'Secure',
    price: '$19/month',
    description: 'Enhanced protection with sharing controls and NDAs',
    icon: <Share2Icon className="w-6 h-6 text-secondary" />,
    features: [
      'All Basic features',
      'Unlimited controlled sharing',
      'NDA integration',
      'Activity tracking',
      '15GB secure storage',
      'Email & chat support',
    ],
    color: 'secondary',
  },
  complete: {
    id: 'complete',
    name: 'Complete',
    price: '$29/month',
    description: 'Comprehensive protection with monitoring and AI assistance',
    icon: <GlobeIcon className="w-6 h-6 text-accent" />,
    features: [
      'All Secure features',
      'IP monitoring & infringement detection',
      'AI monitoring agent for IP protection',
      'Real-time alerts',
      '50GB secure storage',
      'Priority support & consulting',
    ],
    color: 'accent',
  },
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  company: string
  password: string
  confirmPassword: string
  agreedToTerms: boolean
  agreedToMarketing: boolean
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get plan from URL or recommended plan
  const [selectedPlan, setSelectedPlan] = useState<
    'basic' | 'secure' | 'complete'
  >((searchParams.get('plan') as 'basic' | 'secure' | 'complete') || 'secure')

  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
    agreedToMarketing: false,
  })

  // Validation state
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('signup')

    // If no plan is specified, use the recommended plan from assessment
    if (!searchParams.get('plan')) {
      const recommended = getRecommendedPlan()
      if (
        recommended &&
        ['basic', 'secure', 'complete'].includes(recommended)
      ) {
        setSelectedPlan(recommended as 'basic' | 'secure' | 'complete')
      }
    }
  }, [searchParams])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when field is changed
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  // Handle plan selection
  const handleSelectPlan = (planId: 'basic' | 'secure' | 'complete') => {
    setSelectedPlan(planId)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // Redirect to success page
      router.push('/subscription/success')
    }, 1500)
  }

  // Get the selected plan details
  const plan = PLANS[selectedPlan]

  return (
    <div className="flex flex-col items-center" data-testid="signup-container">
      {/* Header Section */}
      <section className="w-full max-w-4xl mx-auto text-center px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Create Your SafeIdea Account
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-6">
          Get started protecting your intellectual property today.
        </p>
      </section>

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Account Creation Form */}
        <div className="md:col-span-7 md:order-1 order-2">
          <Card className="border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className={errors.firstName ? 'border-destructive' : ''}
                      data-testid="firstName-input"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">
                        {errors.firstName as string}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className={errors.lastName ? 'border-destructive' : ''}
                      data-testid="lastName-input"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">
                        {errors.lastName as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={errors.email ? 'border-destructive' : ''}
                    data-testid="email-input"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                    data-testid="company-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      className={errors.password ? 'border-destructive' : ''}
                      data-testid="password-input"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password as string}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={
                        errors.confirmPassword ? 'border-destructive' : ''
                      }
                      data-testid="confirmPassword-input"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start">
                    <Checkbox
                      id="agreedToTerms"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          agreedToTerms: checked === true,
                        }))
                      }
                      className="mt-1 mr-2"
                      data-testid="terms-checkbox"
                    />
                    <Label
                      htmlFor="agreedToTerms"
                      className={`text-sm ${errors.agreedToTerms ? 'text-destructive' : ''}`}
                    >
                      I agree to the{' '}
                      <a href="/terms" className="text-primary underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>

                  <div className="flex items-start">
                    <Checkbox
                      id="agreedToMarketing"
                      name="agreedToMarketing"
                      checked={formData.agreedToMarketing}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          agreedToMarketing: checked === true,
                        }))
                      }
                      className="mt-1 mr-2"
                      data-testid="marketing-checkbox"
                    />
                    <Label htmlFor="agreedToMarketing" className="text-sm">
                      I'd like to receive product updates and marketing
                      communications (optional)
                    </Label>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting}
                data-testid="signup-button"
              >
                {isSubmitting
                  ? 'Creating Account...'
                  : 'Create Account & Start Free Trial'}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-sm text-foreground/60 text-center">
                Your 30-day free trial starts today. No credit card required.
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Plan Summary */}
        <div className="md:col-span-5 md:order-2 order-1">
          <Card
            className={`border border-${plan.color}/30 bg-card/70 backdrop-blur-lg overflow-hidden`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Selected Plan</p>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {plan.icon}
                    {plan.name} Plan
                  </CardTitle>
                </div>
                <div className="text-xl font-bold pricing-blur">
                  {plan.price}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80">{plan.description}</p>

              <div className="space-y-2">
                <p className="font-medium">Included features:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon
                        className={`w-4 h-4 text-${plan.color} mr-2 mt-1`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-muted/30 rounded-md text-sm">
                <p className="font-medium mb-1 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  Free Trial Information
                </p>
                <p className="text-foreground/80">
                  Your plan includes a 30-day free trial. You won't be charged
                  until the trial ends, and you can cancel anytime before then.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/30 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/subscription/plans')}
                data-testid="change-plan-button"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Change Plan
              </Button>

              <div className="flex gap-1">
                {Object.keys(PLANS).map((planId) => (
                  <Button
                    key={planId}
                    variant="ghost"
                    size="sm"
                    className={`px-2 ${selectedPlan === planId ? `text-${PLANS[planId as keyof typeof PLANS].color} font-medium` : ''}`}
                    onClick={() =>
                      handleSelectPlan(
                        planId as 'basic' | 'secure' | 'complete'
                      )
                    }
                    data-testid={`select-${planId}-button`}
                  >
                    {PLANS[planId as keyof typeof PLANS].name}
                  </Button>
                ))}
              </div>
            </CardFooter>
          </Card>

          <div className="mt-6 space-y-4">
            <div className="flex items-start">
              <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
              <p className="text-sm">
                <span className="font-medium">30-day free trial</span> - Try all
                features risk-free
              </p>
            </div>
            <div className="flex items-start">
              <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
              <p className="text-sm">
                <span className="font-medium">No credit card required</span> -
                Set up payment later
              </p>
            </div>
            <div className="flex items-start">
              <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
              <p className="text-sm">
                <span className="font-medium">Cancel anytime</span> - No
                long-term contracts
              </p>
            </div>
            <div className="flex items-start">
              <CheckIcon className="w-5 h-5 text-primary mr-2 mt-0.5" />
              <p className="text-sm">
                <span className="font-medium">Easy plan switching</span> -
                Upgrade or downgrade as needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
