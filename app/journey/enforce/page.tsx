'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  LockClosedIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  GlobeIcon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons'
import {
  saveJourneyData,
  getJourneyData,
  markStepComplete,
} from '@/app/journey/JourneyStorage'
import type { EnforcementLevelType, SharingPreferenceType } from '@/lib/types'

export default function EnforcePage() {
  const router = useRouter()

  // Load previous journey data to adapt UI
  const patentInterest = getJourneyData('patentInterest', null)
  // Use explicit type assertion to tell TypeScript that this can be any of the sharing preference values
  const sharingPreference = getJourneyData(
    'sharingPreference',
    'private'
  ) as SharingPreferenceType

  // Load saved data or use defaults
  const [enforcementLevel, setEnforcementLevel] =
    useState<EnforcementLevelType>(() =>
      getJourneyData('enforcementLevel', 'moderate')
    )
  const [enforcementBudget, setEnforcementBudget] = useState(() =>
    getJourneyData('enforcementBudget', 'medium')
  )
  const [additionalRequirements, setAdditionalRequirements] = useState(() =>
    getJourneyData('additionalRequirements', '')
  )
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Save state changes to storage
  useEffect(() => {
    saveJourneyData('enforcementLevel', enforcementLevel)
    saveJourneyData('enforcementBudget', enforcementBudget)
    saveJourneyData('additionalRequirements', additionalRequirements)
  }, [enforcementLevel, enforcementBudget, additionalRequirements])

  // Client-side validation
  const isValid = () => {
    // Must select enforcement level and budget
    return enforcementLevel && enforcementBudget
  }

  // Handle form completion
  const handleComplete = () => {
    if (!isValid()) return

    setLoading(true)

    // Mark this step as complete
    markStepComplete('enforce')

    // Wait briefly to simulate processing
    setTimeout(() => {
      setCompleted(true)
      setLoading(false)
    }, 1000)
  }

  // Handle journey completion and redirect
  const handleFinish = () => {
    // Navigate to the dashboard or list view
    router.push('/list-ip/mine')

    // Optional: clear journey data since it's complete
    // clearJourneyData();
  }

  // Get recommendations based on prior selections
  const getRecommendations = () => {
    const recommendations = []

    if (patentInterest === 'yes') {
      recommendations.push({
        title: 'Patent Monitoring Service',
        description:
          'Keep track of potential infringements in your technology space',
        icon: <GlobeIcon className="w-5 h-5 text-primary" />,
      })
    }

    if (sharingPreference === 'public' || sharingPreference === 'selective') {
      recommendations.push({
        title: 'Digital Rights Management (DRM)',
        description:
          'Tools for controlling and tracking the use of your digital content',
        icon: <LockClosedIcon className="w-5 h-5 text-primary" />,
      })
    }

    recommendations.push({
      title: 'Legal Consultation',
      description:
        'Schedule a session with an IP attorney to review your enforcement strategy',
      icon: <EnvelopeClosedIcon className="w-5 h-5 text-primary" />,
    })

    return recommendations
  }

  const enforcementRecommendations = getRecommendations()

  return (
    <main>
      <Card className="rounded-xl border border-border/30 bg-background/30 backdrop-blur-lg shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Enforcement & Protection Strategy
          </CardTitle>
          <CardDescription>
            Develop a strategy for protecting and enforcing your intellectual
            property rights.
          </CardDescription>
        </CardHeader>

        {!completed ? (
          <>
            <CardContent className="p-6 space-y-6">
              {/* Enforcement Approach */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Enforcement Approach</h3>
                <p className="text-sm text-foreground/80 mb-3">
                  How would you like to approach potential infringement of your
                  intellectual property?
                </p>

                <RadioGroup
                  value={enforcementLevel}
                  onValueChange={(v) =>
                    setEnforcementLevel(v as EnforcementLevelType)
                  }
                  className="space-y-3"
                  data-testid="journey-enforcement-level"
                >
                  <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                    <RadioGroupItem
                      value="aggressive"
                      id="level-aggressive"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="level-aggressive"
                        className="text-base font-medium"
                      >
                        Aggressive Enforcement
                      </Label>
                      <p className="text-sm text-foreground/70 mt-1">
                        Actively monitor for infringement and take immediate
                        legal action when detected. Maximum protection, but can
                        be resource-intensive.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                    <RadioGroupItem
                      value="moderate"
                      id="level-moderate"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="level-moderate"
                        className="text-base font-medium"
                      >
                        Balanced Approach
                      </Label>
                      <p className="text-sm text-foreground/70 mt-1">
                        Monitor key areas and respond to clear infringement.
                        Seek negotiation before litigation. Good balance of
                        protection and cost.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                    <RadioGroupItem
                      value="passive"
                      id="level-passive"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="level-passive"
                        className="text-base font-medium"
                      >
                        Reactive Protection
                      </Label>
                      <p className="text-sm text-foreground/70 mt-1">
                        Respond only to major infringement that directly impacts
                        your business. Lower cost approach focused on essential
                        protection.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Budget Allocation */}
              <div className="space-y-3 p-4 border border-border/30 rounded-lg">
                <h3 className="text-lg font-medium">Protection Budget Range</h3>
                <p className="text-sm text-foreground/80 mb-2">
                  What budget range are you considering for IP protection and
                  enforcement?
                </p>

                <Select
                  value={enforcementBudget}
                  onValueChange={setEnforcementBudget}
                  data-testid="journey-enforcement-budget"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">
                      Minimal (Under $5,000/year)
                    </SelectItem>
                    <SelectItem value="low">
                      Low ($5,000 - $10,000/year)
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium ($10,000 - $25,000/year)
                    </SelectItem>
                    <SelectItem value="high">
                      High ($25,000 - $50,000/year)
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise ($50,000+/year)
                    </SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs text-foreground/60 mt-1">
                  This helps us recommend appropriate protection services for
                  your needs.
                </p>
              </div>

              {/* Recommendations Based on Choices */}
              <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
                <h3 className="font-medium mb-3">
                  Recommended Protection Services
                </h3>

                <div className="space-y-3">
                  {enforcementRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-2">
                      {rec.icon}
                      <div>
                        <h4 className="text-sm font-medium">{rec.title}</h4>
                        <p className="text-xs text-foreground/70">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-foreground/60 mt-3">
                  These recommendations are based on your selections throughout
                  the IP journey.
                </p>
              </div>

              {/* Additional Requirements */}
              <div className="space-y-2">
                <Label
                  htmlFor="additional-requirements"
                  className="text-base font-medium"
                >
                  Additional Requirements or Concerns
                </Label>
                <Textarea
                  id="additional-requirements"
                  placeholder="Are there any specific concerns or requirements for your enforcement strategy?"
                  className="h-24 resize-none"
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  data-testid="journey-additional-requirements"
                />
              </div>

              {enforcementLevel === 'aggressive' && (
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-md flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground/90 font-medium">
                      Aggressive Enforcement Consideration
                    </p>
                    <p className="text-xs text-foreground/80 mt-1">
                      This approach requires significant resources and can
                      impact your reputation in some industries. Our team will
                      contact you to discuss implementation details.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t border-border/30 p-6 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/journey/manage')}
                className="gap-1"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={handleComplete}
                disabled={!isValid() || loading}
                className="gap-1"
                data-testid="journey-enforce-complete"
              >
                {loading ? 'Processing...' : 'Complete Journey'}
                {!loading && <ArrowRightIcon className="w-4 h-4" />}
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardContent className="space-y-6 py-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <CheckCircledIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>

                <h2 className="text-xl font-bold mb-2">Journey Complete!</h2>
                <p className="text-foreground/80 mb-6">
                  Congratulations on completing your IP protection journey. Your
                  intellectual property strategy has been set up successfully.
                </p>

                <div className="border border-border/30 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium mb-2">What Happens Next</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Your IP has been recorded and protected in your
                        portfolio
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        You'll receive notifications based on your selected
                        frequency
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Your management tools are now available in your
                        dashboard
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Protection monitoring has been configured per your
                        settings
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-border/30 pt-4">
              <Button
                onClick={handleFinish}
                className="gap-1 px-6"
                data-testid="journey-finish"
              >
                Go to My Portfolio
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </main>
  )
}
