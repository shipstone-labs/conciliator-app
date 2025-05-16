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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  InfoCircledIcon,
  Share1Icon,
  PersonIcon,
  LockClosedIcon,
  GlobeIcon,
} from '@radix-ui/react-icons'
import {
  saveJourneyData,
  getJourneyData,
  markStepComplete,
} from '@/app/journey/JourneyStorage'
import type { SharingPreferenceType } from '@/lib/types'
import { hasMinLength, validateForm } from '@/app/journey/FormValidation'

export default function SharePage() {
  const router = useRouter()

  // Load previous decisions to adapt UI
  const patentInterest = getJourneyData('patentInterest', null)

  // Load saved data or use defaults
  const [sharingPreference, setSharingPreference] =
    useState<SharingPreferenceType>(() =>
      getJourneyData('sharingPreference', 'private')
    )
  const [ndaRequired, setNdaRequired] = useState(() =>
    getJourneyData('ndaRequired', false)
  )
  const [allowAiAgent, setAllowAiAgent] = useState(() =>
    getJourneyData('allowAiAgent', false)
  )
  const [ndaRequirements, setNdaRequirements] = useState(() =>
    getJourneyData('ndaRequirements', '')
  )
  const [distributionPlan, setDistributionPlan] = useState(() =>
    getJourneyData('distributionPlan', '')
  )
  const [loading, setLoading] = useState(false)

  // Save state changes to storage
  useEffect(() => {
    saveJourneyData('sharingPreference', sharingPreference)
    saveJourneyData('ndaRequired', ndaRequired)
    saveJourneyData('allowAiAgent', allowAiAgent)
    saveJourneyData('ndaRequirements', ndaRequirements)
    saveJourneyData('distributionPlan', distributionPlan)
  }, [
    sharingPreference,
    ndaRequired,
    allowAiAgent,
    ndaRequirements,
    distributionPlan,
  ])

  // Client-side validation
  const isValid = () => {
    return validateForm({
      // Must select a sharing preference
      sharingPreference: Boolean(sharingPreference),

      // If NDA is required, must provide requirements
      ndaRequirements: !ndaRequired || hasMinLength(ndaRequirements, 10),

      // If public sharing, must provide a distribution plan
      distributionPlan:
        sharingPreference !== 'public' || hasMinLength(distributionPlan, 10),
    })
  }

  // Handle continue button click
  const handleContinue = () => {
    if (!isValid()) return

    setLoading(true)

    // Mark this step as complete
    markStepComplete('share')

    // Wait briefly to simulate processing
    setTimeout(() => {
      // Navigate to the next step
      router.push('/journey/manage')
    }, 500)
  }

  return (
    <main>
      <Card className="rounded-xl border border-border/30 bg-background/30 backdrop-blur-lg shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Share Your Intellectual Property
          </CardTitle>
          <CardDescription>
            Control how your idea is shared and set terms for access and usage.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Sharing Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              How would you like to share your idea?
            </h3>

            <RadioGroup
              value={sharingPreference}
              onValueChange={(v) =>
                setSharingPreference(v as SharingPreferenceType)
              }
              className="space-y-3"
              data-testid="journey-sharing-preference"
            >
              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem
                  value="private"
                  id="sharing-private"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <LockClosedIcon className="w-4 h-4 mr-2 text-primary" />
                    <Label
                      htmlFor="sharing-private"
                      className="text-base font-medium"
                    >
                      Private - By Invitation Only
                    </Label>
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">
                    Keep your idea private and share individually with specific
                    people. Maximum security and control.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem
                  value="selective"
                  id="sharing-selective"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <PersonIcon className="w-4 h-4 mr-2 text-primary" />
                    <Label
                      htmlFor="sharing-selective"
                      className="text-base font-medium"
                    >
                      Selective - Qualified Audience
                    </Label>
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">
                    Share with a limited audience of qualified individuals or
                    organizations. Balances visibility with security.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem
                  value="public"
                  id="sharing-public"
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <GlobeIcon className="w-4 h-4 mr-2 text-primary" />
                    <Label
                      htmlFor="sharing-public"
                      className="text-base font-medium"
                    >
                      Public - Wider Distribution
                    </Label>
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">
                    Make your idea available to a broader audience. Best for
                    marketing and raising awareness. Some protection measures
                    still apply.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* NDA Requirements Section */}
          <div className="p-4 border border-border/30 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <LockClosedIcon className="w-5 h-5 mr-2 text-primary" />
                <h3 className="text-lg font-medium">
                  Non-Disclosure Agreement (NDA)
                </h3>
              </div>

              <Switch
                checked={ndaRequired}
                onCheckedChange={setNdaRequired}
                id="nda-toggle"
                data-testid="journey-nda-toggle"
              />
            </div>

            <p className="text-sm text-foreground/80">
              {ndaRequired
                ? 'Recipients will be required to sign an NDA before accessing your idea.'
                : 'No NDA will be required for recipients to access your idea.'}
            </p>

            {ndaRequired && (
              <div className="mt-3 space-y-2">
                <Label
                  htmlFor="nda-requirements"
                  className="text-base font-medium"
                >
                  NDA Requirements
                </Label>
                <Textarea
                  id="nda-requirements"
                  placeholder="Specify any special terms or requirements for the NDA..."
                  className="h-20 resize-none"
                  value={ndaRequirements}
                  onChange={(e) => setNdaRequirements(e.target.value)}
                  data-testid="journey-nda-requirements"
                />
                <p className="text-xs text-foreground/60">
                  These requirements will be included in the NDA template.
                </p>
              </div>
            )}

            {/* Patent Warning for Public Sharing */}
            {patentInterest === 'yes' && sharingPreference === 'public' && (
              <div className="mt-3 p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-md flex items-start gap-2">
                <InfoCircledIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground/90 font-medium">
                    Patent Protection Warning
                  </p>
                  <p className="text-xs text-foreground/80 mt-1">
                    Public disclosure of your idea may affect patent rights in
                    some jurisdictions. Consider consulting with a patent
                    attorney before proceeding with public sharing.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Sales Agent Section */}
          <div className="p-4 border border-border/30 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Share1Icon className="w-5 h-5 mr-2 text-primary" />
                <h3 className="text-lg font-medium">AI Sales Agent</h3>
              </div>

              <Switch
                checked={allowAiAgent}
                onCheckedChange={setAllowAiAgent}
                id="ai-toggle"
                data-testid="journey-ai-toggle"
              />
            </div>

            <p className="text-sm text-foreground/80">
              {allowAiAgent
                ? 'Our AI agent will actively promote your idea to relevant parties based on your sharing preferences.'
                : 'Your idea will not be actively promoted by our AI agent.'}
            </p>

            {allowAiAgent && (
              <div className="mt-2 p-3 bg-muted/20 rounded-md">
                <h4 className="text-sm font-medium">AI Agent Capabilities</h4>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-foreground/80">
                  <li>Identify potential partners, investors, or buyers</li>
                  <li>Respond to basic inquiries about your idea</li>
                  <li>Handle initial NDA arrangements</li>
                  <li>Qualify leads based on your criteria</li>
                  <li>Schedule meetings with qualified prospects</li>
                </ul>
              </div>
            )}
          </div>

          {/* Distribution Plan for Public Sharing */}
          {sharingPreference === 'public' && (
            <div className="space-y-3 mt-2">
              <Label
                htmlFor="distribution-plan"
                className="text-base font-medium"
              >
                Distribution Plan
              </Label>
              <Textarea
                id="distribution-plan"
                placeholder="Describe how you plan to distribute and promote your idea publicly..."
                className="h-24 resize-none"
                value={distributionPlan}
                onChange={(e) => setDistributionPlan(e.target.value)}
                data-testid="journey-distribution-plan"
              />
              <p className="text-xs text-foreground/60">
                This helps us understand your public sharing goals and provide
                appropriate support.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border/30 p-6 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/journey/provisional')}
            className="gap-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!isValid() || loading}
            className="gap-1"
            data-testid="journey-share-continue"
          >
            {loading ? 'Processing...' : 'Continue'}
            {!loading && <ArrowRightIcon className="w-4 h-4" />}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
