'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { useStytchUser } from '@stytch/nextjs'
import { useEffect, useState } from 'react'
import HomeLink from '@/components/HomeLink'
import { JOURNEY_STEPS } from '@/app/journey/JourneyStorage'

export default function JourneyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isInitialized } = useStytchUser()
  const [progress, setProgress] = useState(0)

  // Determine progress based on current path
  useEffect(() => {
    const currentStep = JOURNEY_STEPS.find((step) => step.path === pathname)
    if (currentStep) {
      setProgress(currentStep.position)
    }
  }, [pathname])

  // If not initialized or not logged in, show a minimal layout
  if (!isInitialized || !user) {
    return (
      <div className="flex flex-col items-center min-h-screen px-6 pt-12 pb-16">
        <div className="w-full max-w-4xl mx-auto">
          <HomeLink />
          <div className="my-8 text-center">
            <h1 className="text-2xl font-bold text-primary">Please Log In</h1>
            <p className="mt-2 text-foreground/80">
              You need to be logged in to access the SafeIdea journey.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 md:px-6 pt-12 pb-16">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8">
          <HomeLink />
          <h1 className="mt-6 text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            IP Protection Journey
          </h1>

          {/* Progress indicator */}
          <div className="mt-6">
            <Progress
              value={progress}
              className="h-2 bg-muted/50"
              data-testid="journey-progress"
            />

            {/* Step indicators */}
            <div className="flex justify-between mt-2 text-xs text-foreground/70">
              {JOURNEY_STEPS.map((step) => (
                <div
                  key={step.path}
                  className={`${pathname === step.path ? 'text-primary font-medium' : ''}`}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="w-full">{children}</main>

        <footer className="mt-12 text-center text-sm text-foreground/60">
          <p>
            SafeIdea helps you protect your intellectual property through every
            stage of its journey.
          </p>
        </footer>
      </div>
    </div>
  )
}
