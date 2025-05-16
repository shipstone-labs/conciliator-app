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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  InfoCircledIcon,
  StarIcon,
  StarFilledIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'
import {
  saveJourneyData,
  getJourneyData,
  markStepComplete,
} from '@/app/journey/JourneyStorage'
import type { PatentPriorityLevel } from '@/lib/types'

export default function ProvisionalPage() {
  const router = useRouter()

  // Get previous decision to customize UI
  const hasDocumentation = getJourneyData('hasDocumentation', false)

  // Load saved data or use defaults
  const [patentInterest, setPatentInterest] = useState<string | null>(() =>
    getJourneyData('patentInterest', null)
  )
  const [patentDescription, setPatentDescription] = useState(() =>
    getJourneyData('patentDescription', '')
  )
  const [patentPriority, setPatentPriority] = useState<PatentPriorityLevel>(
    () => getJourneyData('patentPriority', 'medium')
  )
  const [loading, setLoading] = useState(false)

  // Save state changes to storage
  useEffect(() => {
    if (patentInterest !== null) {
      saveJourneyData('patentInterest', patentInterest)
    }
    saveJourneyData('patentDescription', patentDescription)
    saveJourneyData('patentPriority', patentPriority)
  }, [patentInterest, patentDescription, patentPriority])

  // Client-side validation
  const isValid = () => {
    // Must select a patent interest option
    if (patentInterest === null) return false

    // If interested in patent, must provide description
    if (patentInterest === 'yes' && patentDescription.trim().length < 20)
      return false

    return true
  }

  // Handle continue button click
  const handleContinue = () => {
    if (!isValid()) return

    setLoading(true)

    // Mark this step as complete
    markStepComplete('provisional')

    // Wait briefly to simulate processing
    setTimeout(() => {
      // Navigate to the next step
      router.push('/journey/share')
    }, 500)
  }

  // Go back to appropriate page based on documentation status
  const handleBack = () => {
    if (hasDocumentation) {
      router.push('/journey/start')
    } else {
      router.push('/journey/document')
    }
  }

  return (
    <main>
      <Card className="rounded-xl border border-border/30 bg-background/30 backdrop-blur-lg shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Patent Protection Options
          </CardTitle>
          <CardDescription>
            Determine if your idea might qualify for patent protection and
            explore preliminary steps.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info Card */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border/30 flex items-start gap-3">
            <InfoCircledIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">About Provisional Patents</h3>
              <p className="text-sm text-foreground/80">
                A provisional patent application establishes an early filing
                date for your invention and gives you 12 months to file a
                non-provisional application. It's a lower-cost way to begin the
                patent process while you refine your invention.
              </p>
            </div>
          </div>

          {/* Patent Interest Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">
              Are you interested in exploring patent protection?
            </h3>

            <RadioGroup
              value={patentInterest || ''}
              onValueChange={setPatentInterest}
              className="space-y-3"
              data-testid="journey-patent-interest-radio"
            >
              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem value="yes" id="patent-yes" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="patent-yes" className="text-base font-medium">
                    Yes, I want to explore patent options
                  </Label>
                  <p className="text-sm text-foreground/70 mt-1">
                    My idea involves a novel process, method, machine, or
                    composition of matter that may qualify for patent
                    protection.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem
                  value="unsure"
                  id="patent-unsure"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="patent-unsure"
                    className="text-base font-medium"
                  >
                    I'm not sure if a patent applies
                  </Label>
                  <p className="text-sm text-foreground/70 mt-1">
                    I'd like to learn more about patent requirements before
                    deciding.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-md border border-border/30 hover:bg-muted/20 transition-colors">
                <RadioGroupItem value="no" id="patent-no" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="patent-no" className="text-base font-medium">
                    No, I'm seeking other forms of protection
                  </Label>
                  <p className="text-sm text-foreground/70 mt-1">
                    My idea may be better suited for copyright, trademark, or
                    trade secret protection.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Sections Based on Patent Interest */}
          {patentInterest === 'yes' && (
            <div className="space-y-5 mt-4 p-4 border border-border/30 rounded-lg">
              <h3 className="text-lg font-medium">
                Patent Application Information
              </h3>

              <div className="space-y-2">
                <Label
                  htmlFor="patent-description"
                  className="text-base font-medium"
                >
                  Briefly describe your invention
                </Label>
                <Textarea
                  id="patent-description"
                  placeholder="Describe the key technical aspects that make your invention novel and non-obvious..."
                  className="h-32 resize-none"
                  value={patentDescription}
                  onChange={(e) => setPatentDescription(e.target.value)}
                  data-testid="journey-patent-description"
                />
                <p className="text-xs text-foreground/60">
                  This helps determine patent eligibility and preparation
                  requirements.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Patent Priority Level
                </Label>
                <p className="text-sm text-foreground/70 mb-2">
                  How quickly do you need to secure patent protection?
                </p>

                <RadioGroup
                  value={patentPriority}
                  onValueChange={(v) =>
                    setPatentPriority(v as PatentPriorityLevel)
                  }
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                  data-testid="journey-patent-priority"
                >
                  <div
                    className={`flex flex-col items-center p-3 rounded-md border ${patentPriority === 'low' ? 'border-primary' : 'border-border/30'} hover:bg-muted/20 transition-colors`}
                  >
                    <RadioGroupItem
                      value="low"
                      id="priority-low"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="priority-low"
                      className="cursor-pointer text-center w-full"
                    >
                      <StarIcon className="w-6 h-6 mb-2 mx-auto text-foreground/70" />
                      <span className="font-medium">Low Priority</span>
                      <p className="text-xs text-foreground/70 mt-1">
                        Early development stage, exploring options
                      </p>
                    </Label>
                  </div>

                  <div
                    className={`flex flex-col items-center p-3 rounded-md border ${patentPriority === 'medium' ? 'border-primary' : 'border-border/30'} hover:bg-muted/20 transition-colors`}
                  >
                    <RadioGroupItem
                      value="medium"
                      id="priority-medium"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="priority-medium"
                      className="cursor-pointer text-center w-full"
                    >
                      <div className="flex justify-center mb-2">
                        <StarFilledIcon className="w-6 h-6 text-amber-500" />
                        <StarFilledIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="font-medium">Medium Priority</span>
                      <p className="text-xs text-foreground/70 mt-1">
                        Ready to file within next few months
                      </p>
                    </Label>
                  </div>

                  <div
                    className={`flex flex-col items-center p-3 rounded-md border ${patentPriority === 'high' ? 'border-primary' : 'border-border/30'} hover:bg-muted/20 transition-colors`}
                  >
                    <RadioGroupItem
                      value="high"
                      id="priority-high"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="priority-high"
                      className="cursor-pointer text-center w-full"
                    >
                      <div className="flex justify-center mb-2">
                        <StarFilledIcon className="w-6 h-6 text-amber-500" />
                        <StarFilledIcon className="w-6 h-6 text-amber-500" />
                        <StarFilledIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="font-medium">High Priority</span>
                      <p className="text-xs text-foreground/70 mt-1">
                        Urgent, needs immediate protection
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {patentInterest === 'unsure' && (
            <div className="mt-4 p-4 border border-border/30 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <QuestionMarkCircledIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">Is Your Idea Patentable?</h3>
                  <p className="text-sm text-foreground/80">
                    Your idea may be patentable if it meets these criteria:
                  </p>
                </div>
              </div>

              <div className="ml-8 space-y-3">
                <div className="p-2 bg-muted/20 rounded-md">
                  <h4 className="font-medium text-sm">Novel</h4>
                  <p className="text-xs text-foreground/70">
                    Your invention must be new and not previously known or
                    published.
                  </p>
                </div>

                <div className="p-2 bg-muted/20 rounded-md">
                  <h4 className="font-medium text-sm">Non-obvious</h4>
                  <p className="text-xs text-foreground/70">
                    The invention must not be obvious to someone with ordinary
                    skill in your field.
                  </p>
                </div>

                <div className="p-2 bg-muted/20 rounded-md">
                  <h4 className="font-medium text-sm">Useful</h4>
                  <p className="text-xs text-foreground/70">
                    The invention must have a practical, real-world application.
                  </p>
                </div>

                <div className="p-2 bg-muted/20 rounded-md">
                  <h4 className="font-medium text-sm">
                    Patent-Eligible Subject Matter
                  </h4>
                  <p className="text-xs text-foreground/70">
                    Must be a process, machine, article of manufacture, or
                    composition of matter.
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground/80 mt-2 ml-8">
                We recommend scheduling a patent consultation with a registered
                patent attorney to determine if your idea meets these
                requirements.
              </p>
            </div>
          )}

          {patentInterest === 'no' && (
            <div className="mt-4 p-4 border border-border/30 rounded-lg space-y-4">
              <h3 className="font-medium">Alternative Protection Methods</h3>
              <p className="text-sm text-foreground/80">
                Based on your selection, we'll focus on these alternative
                protection methods:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="font-medium">Copyright Protection</h4>
                  <p className="text-xs text-foreground/70 mt-1">
                    For creative works, software, content, and artistic
                    expressions.
                  </p>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="font-medium">Trademark Protection</h4>
                  <p className="text-xs text-foreground/70 mt-1">
                    For brand names, logos, and identifying elements.
                  </p>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="font-medium">Trade Secret Protection</h4>
                  <p className="text-xs text-foreground/70 mt-1">
                    For confidential business information and processes.
                  </p>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="font-medium">Contractual Protection</h4>
                  <p className="text-xs text-foreground/70 mt-1">
                    NDAs, licensing agreements, and other legal frameworks.
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground/80">
                The next steps will focus on implementing these alternative
                protections for your idea.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border/30 p-6 pt-4">
          <Button variant="outline" onClick={handleBack} className="gap-1">
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!isValid() || loading}
            className="gap-1"
            data-testid="journey-provisional-continue"
          >
            {loading ? 'Processing...' : 'Continue'}
            {!loading && <ArrowRightIcon className="w-4 h-4" />}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
