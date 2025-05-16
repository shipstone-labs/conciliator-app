'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
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
import {
  ArrowRightIcon,
  InfoCircledIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons'
import {
  saveJourneyData,
  getJourneyData,
  markStepComplete,
} from '@/app/journey/JourneyStorage'

export default function StartPage() {
  const router = useRouter()
  const _pathname = usePathname()

  // Initialize state with stored data or defaults
  const [documented, setDocumented] = useState<string | null>(
    getJourneyData('hasDocumentation', null)
  )
  const [loading, setLoading] = useState(false)

  // Save state changes to storage
  useEffect(() => {
    if (documented !== null) {
      saveJourneyData('hasDocumentation', documented === 'yes')
    }
  }, [documented])

  // Handle continue button click
  const handleContinue = () => {
    if (!documented) return

    setLoading(true)

    // Mark this step as complete
    markStepComplete('start')

    // Route based on user's selection
    if (documented === 'yes') {
      router.push('/journey/provisional')
    } else {
      router.push('/journey/document')
    }
  }

  return (
    <main>
      <Card className="rounded-xl border border-border/30 bg-background/30 backdrop-blur-lg shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Start Your IP Protection Journey
          </CardTitle>
          <CardDescription>
            Welcome to SafeIdea's guided journey to help secure and manage your
            intellectual property. This process will guide you through the
            essential steps to protect your ideas.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="p-4 bg-muted/30 rounded-lg border border-border/30 flex items-start gap-3">
            <InfoCircledIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">Why protect your idea?</h3>
              <p className="text-sm text-foreground/80">
                Protecting your intellectual property establishes ownership,
                prevents unauthorized use, creates business value, and opens
                opportunities for licensing or partnerships.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">
              Have you already documented your idea in detail?
            </h3>

            <RadioGroup
              value={documented || ''}
              onValueChange={setDocumented}
              className="space-y-3"
              data-testid="journey-documented-radio"
            >
              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem
                  value="yes"
                  id="documented-yes"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="documented-yes"
                    className="text-base font-medium"
                  >
                    Yes, I have detailed documentation
                  </Label>
                  <p className="text-sm text-foreground/70 mt-1">
                    I have comprehensive descriptions, diagrams, and/or
                    prototypes of my idea.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem
                  value="no"
                  id="documented-no"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="documented-no"
                    className="text-base font-medium"
                  >
                    No, I need help documenting my idea
                  </Label>
                  <p className="text-sm text-foreground/70 mt-1">
                    I need guidance on properly documenting my idea before
                    proceeding with protection.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {documented === 'no' && (
            <div className="p-4 rounded-lg border border-border/30 flex items-start gap-3 mt-4 bg-amber-500/10 dark:bg-amber-500/5">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1 text-amber-600 dark:text-amber-400">
                  Documentation First
                </h3>
                <p className="text-sm text-foreground/80">
                  Thorough documentation is essential before seeking formal
                  protection. We'll guide you through creating proper
                  documentation that can strengthen your IP claims.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border/30 p-6 pt-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            Cancel
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!documented || loading}
            className="gap-1"
            data-testid="journey-continue-button"
          >
            Continue
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
