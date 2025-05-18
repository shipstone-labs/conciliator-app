'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  trackFunnelPageVisit,
  saveAssessmentAnswer,
  getAssessmentAnswers,
  setRecommendedPlan,
} from '../SubscriptionStorage'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircledIcon,
  LockClosedIcon,
  GlobeIcon,
} from '@radix-ui/react-icons'

// Assessment questions and options
const ASSESSMENT_QUESTIONS = [
  {
    id: 'type',
    title: 'What type of intellectual property are you looking to protect?',
    description: 'This helps us understand the nature of your IP assets.',
    options: [
      {
        id: 'invention',
        label: 'Invention or Innovation',
        description:
          'New technologies or products that could potentially be patented',
      },
      {
        id: 'trade-secret',
        label: 'Trade Secrets / Confidential Information',
        description:
          'Internal processes, formulas, or methods that give your business an advantage',
      },
      {
        id: 'business-model',
        label: 'Business Model or Strategy',
        description:
          'Innovative business approaches, marketing plans, or strategic documents',
      },
      {
        id: 'creative-work',
        label: 'Creative Works',
        description:
          'Written content, designs, music, software code, or other creative assets',
      },
      {
        id: 'unsure',
        label: "I'm not sure yet",
        description:
          "You have ideas or content but aren't sure how to categorize them",
      },
    ],
  },
  {
    id: 'sharing',
    title: 'Do you need to share your intellectual property with others?',
    description:
      'This helps us determine the level of sharing controls you need.',
    options: [
      {
        id: 'no-sharing',
        label: 'No, I just need secure documentation',
        description:
          "You want to establish ownership and timeline but don't need to share",
      },
      {
        id: 'limited-sharing',
        label: 'Yes, with a small team or select partners',
        description: 'You need to share with a limited, known group of people',
      },
      {
        id: 'investor-sharing',
        label: 'Yes, with potential investors or partners',
        description:
          'You need to share with outside business contacts under NDAs',
      },
      {
        id: 'public-licensing',
        label: 'Yes, with controlled licensing or sales',
        description:
          'You want to monetize your IP through broader but controlled access',
      },
      {
        id: 'undecided',
        label: "I'm not sure yet",
        description: "You haven't decided on your sharing strategy",
      },
    ],
  },
  {
    id: 'concern',
    title: "What's your biggest concern about your intellectual property?",
    description:
      'This helps us tailor protection features to your specific needs.',
    options: [
      {
        id: 'theft',
        label: 'Theft or unauthorized copying',
        description:
          "You're worried someone will steal or copy your ideas/work",
      },
      {
        id: 'proof',
        label: 'Proving I created it first',
        description: 'You want to establish a clear timeline of ownership',
      },
      {
        id: 'nda-enforcement',
        label: 'Making sure NDAs are enforceable',
        description:
          'You need confidence that sharing agreements will be respected',
      },
      {
        id: 'monetization',
        label: 'Finding ways to monetize it',
        description:
          'You want to generate revenue from your intellectual property',
      },
      {
        id: 'visibility',
        label: 'Getting more visibility',
        description: 'You want your ideas to reach a broader audience',
      },
    ],
  },
  {
    id: 'budget',
    title: "What's your monthly budget for intellectual property protection?",
    description:
      'This helps us recommend the most appropriate plan for your needs.',
    options: [
      {
        id: 'minimal',
        label: 'Less than $10/month',
        description: 'Basic protection with minimal features',
      },
      {
        id: 'moderate',
        label: '$10-20/month',
        description: 'Standard protection with essential features',
      },
      {
        id: 'premium',
        label: '$20-30/month',
        description: 'Enhanced protection with advanced features',
      },
      {
        id: 'enterprise',
        label: 'More than $30/month',
        description: 'Comprehensive protection with all available features',
      },
      {
        id: 'undecided',
        label: "I'm evaluating options",
        description: 'You want to see pricing options before deciding',
      },
    ],
  },
  {
    id: 'timeline',
    title: 'How soon do you need protection in place?',
    description:
      'This helps us prioritize your setup and recommend appropriate steps.',
    options: [
      {
        id: 'immediate',
        label: 'Immediately (within days)',
        description: 'You have an urgent need for protection',
      },
      {
        id: 'soon',
        label: 'Soon (within weeks)',
        description: "You're planning to share or publish soon",
      },
      {
        id: 'planning',
        label: 'Planning ahead (within months)',
        description: "You're preparing for future releases or sharing",
      },
      {
        id: 'exploring',
        label: 'Just exploring options',
        description: "You're researching what's available for future reference",
      },
      {
        id: 'already-public',
        label: 'My work is already public',
        description: 'You need protection for existing published work',
      },
    ],
  },
]

// Logic to determine recommended plan based on answers
function determineRecommendedPlan(answers: Record<string, string>): string {
  // Count points toward each plan type
  let basicPoints = 0
  let securePoints = 0
  let completePoints = 0

  // Type question
  if (answers.type === 'trade-secret' || answers.type === 'invention') {
    securePoints += 2
    completePoints += 1
  } else if (answers.type === 'creative-work') {
    basicPoints += 1
    securePoints += 1
  } else if (answers.type === 'business-model') {
    securePoints += 1
    completePoints += 1
  }

  // Sharing question
  if (answers.sharing === 'no-sharing') {
    basicPoints += 2
  } else if (answers.sharing === 'limited-sharing') {
    securePoints += 1
  } else if (
    answers.sharing === 'investor-sharing' ||
    answers.sharing === 'public-licensing'
  ) {
    securePoints += 2
    completePoints += 1
  }

  // Concern question
  if (answers.concern === 'theft') {
    completePoints += 2
  } else if (answers.concern === 'proof') {
    basicPoints += 2
  } else if (answers.concern === 'nda-enforcement') {
    securePoints += 2
  } else if (
    answers.concern === 'monetization' ||
    answers.concern === 'visibility'
  ) {
    completePoints += 2
  }

  // Budget question
  if (answers.budget === 'minimal') {
    basicPoints += 3
  } else if (answers.budget === 'moderate') {
    securePoints += 3
  } else if (answers.budget === 'premium' || answers.budget === 'enterprise') {
    completePoints += 3
  }

  // Timeline question
  if (answers.timeline === 'immediate') {
    securePoints += 1
    completePoints += 1
  } else if (answers.timeline === 'soon') {
    basicPoints += 1
    securePoints += 1
  }

  // Determine which plan has the most points
  if (completePoints >= securePoints && completePoints >= basicPoints) {
    return 'complete'
  }

  if (securePoints >= basicPoints) {
    return 'secure'
  }

  return 'basic'
}

export default function AssessmentPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(
    getAssessmentAnswers()
  )
  const [showResults, setShowResults] = useState(false)

  // Track page visit
  useEffect(() => {
    trackFunnelPageVisit('assessment')
  }, [])

  // Current question
  const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex]

  // Save answer and navigate
  const handleAnswer = (questionId: string, answerId: string) => {
    // Update local state
    const newAnswers = { ...answers, [questionId]: answerId }
    setAnswers(newAnswers)

    // Save to storage
    saveAssessmentAnswer(questionId, answerId)

    // Move to next question or show results
    if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      const recommendedPlan = determineRecommendedPlan(newAnswers)
      setRecommendedPlan(recommendedPlan)
      setShowResults(true)
    }
  }

  // Go back to previous question
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  // Calculate progress percentage
  const progress = (currentQuestionIndex / ASSESSMENT_QUESTIONS.length) * 100

  // Proceed to plans page
  const handleViewPlans = () => {
    router.push('/plan/plans')
  }

  return (
    <div
      className="flex flex-col items-center"
      data-testid="assessment-container"
    >
      {/* Header Section */}
      <section className="w-full max-w-3xl mx-auto text-center px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-heading-gradient-from to-heading-gradient-to bg-clip-text text-transparent">
          Find Your Perfect Protection Plan
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-6">
          Answer a few quick questions so we can recommend the best plan for
          your intellectual property needs.
        </p>
      </section>

      {showResults ? (
        /* Results View */
        <Card
          className="w-full max-w-3xl mx-auto border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden mb-8"
          data-testid="assessment-results"
        >
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl md:text-2xl">
              We've Found Your Ideal Protection Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <CheckCircledIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">
                Based on your needs, we recommend:
              </h3>

              {answers.budget === 'minimal' ||
              getAssessmentAnswers().budget === 'minimal' ? (
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-primary mb-1">
                    Basic Plan
                  </div>
                  <div className="text-foreground/80">
                    Essential protection for your ideas
                  </div>
                </div>
              ) : answers.budget === 'moderate' ||
                answers.sharing === 'investor-sharing' ||
                answers.concern === 'nda-enforcement' ? (
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    Secure Plan
                  </div>
                  <div className="text-foreground/80">
                    Enhanced protection with sharing controls
                  </div>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-accent mb-1">
                    Complete Plan
                  </div>
                  <div className="text-foreground/80">
                    Comprehensive protection and monitoring
                  </div>
                </div>
              )}

              <div className="bg-muted/30 rounded-lg p-6 w-full mb-6">
                <h4 className="font-medium mb-3">
                  This recommendation is based on:
                </h4>
                <ul className="space-y-2">
                  {answers.type && (
                    <li className="flex items-start">
                      <div className="mt-0.5 mr-2 text-primary">•</div>
                      <div>
                        <span className="font-medium">IP Type:</span>{' '}
                        {ASSESSMENT_QUESTIONS[0].options.find(
                          (o) => o.id === answers.type
                        )?.label || 'Not specified'}
                      </div>
                    </li>
                  )}
                  {answers.sharing && (
                    <li className="flex items-start">
                      <div className="mt-0.5 mr-2 text-primary">•</div>
                      <div>
                        <span className="font-medium">Sharing needs:</span>{' '}
                        {ASSESSMENT_QUESTIONS[1].options.find(
                          (o) => o.id === answers.sharing
                        )?.label || 'Not specified'}
                      </div>
                    </li>
                  )}
                  {answers.concern && (
                    <li className="flex items-start">
                      <div className="mt-0.5 mr-2 text-primary">•</div>
                      <div>
                        <span className="font-medium">Main concern:</span>{' '}
                        {ASSESSMENT_QUESTIONS[2].options.find(
                          (o) => o.id === answers.concern
                        )?.label || 'Not specified'}
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-foreground/80 text-center mb-6">
                Let's explore all plan options to find your perfect fit.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <Button
              size="lg"
              onClick={handleViewPlans}
              data-testid="view-plans-button"
            >
              View All Plans
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* Question View */
        <Card
          className="w-full max-w-3xl mx-auto border border-border/30 bg-card/70 backdrop-blur-lg overflow-hidden mb-8"
          data-testid={`question-${currentQuestion.id}`}
        >
          <CardHeader className="pb-2">
            {/* Progress indicator */}
            <div className="w-full bg-muted/50 h-2 rounded-full mb-6 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            <CardTitle className="text-xl md:text-2xl">
              {currentQuestion.title}
            </CardTitle>
            <p className="text-foreground/80 mt-2">
              {currentQuestion.description}
            </p>
          </CardHeader>

          <CardContent className="px-6 pt-2 pb-6">
            <RadioGroup
              className="space-y-3"
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              data-testid={`radio-group-${currentQuestion.id}`}
            >
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-start">
                  <div className="flex h-6 items-center mt-0.5">
                    <RadioGroupItem
                      value={option.id}
                      id={`${currentQuestion.id}-${option.id}`}
                      className="mr-2"
                      data-testid={`option-${option.id}`}
                    />
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor={`${currentQuestion.id}-${option.id}`}
                      className="block font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-foreground/70 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>

          <CardFooter className="flex justify-between pb-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              data-testid="prev-question-button"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={() => {
                if (answers[currentQuestion.id]) {
                  if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                  } else {
                    const recommendedPlan = determineRecommendedPlan(answers)
                    setRecommendedPlan(recommendedPlan)
                    setShowResults(true)
                  }
                }
              }}
              disabled={!answers[currentQuestion.id]}
              data-testid="next-question-button"
            >
              {currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1
                ? 'Next'
                : 'See Results'}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Informational Section */}
      <section className="w-full max-w-3xl mx-auto px-4 py-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <CheckCircledIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Tailored Protection</h3>
            <p className="text-sm text-foreground/70">
              Your answers help us customize a protection strategy that fits
              your specific needs.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
              <LockClosedIcon className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-medium mb-2">Secure Storage</h3>
            <p className="text-sm text-foreground/70">
              All plans include our core secure, encrypted storage with
              immutable timestamps.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              <GlobeIcon className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-medium mb-2">Global Protection</h3>
            <p className="text-sm text-foreground/70">
              Your intellectual property is protected worldwide with our
              decentralized approach.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
