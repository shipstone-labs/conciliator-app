'use client'

import { usePathname } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'
import HomeLink from '@/components/HomeLink'
import { FUNNEL_STEPS } from './FunnelSteps'

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)

  // Determine progress based on current path
  useEffect(() => {
    // Find the matching step, handle special cases for detail pages
    let currentStep = FUNNEL_STEPS.find((step) => step.path === pathname)

    // Handle plan detail pages (basic, secure, complete)
    if (
      !currentStep &&
      (pathname === '/plan/basic' ||
        pathname === '/plan/secure' ||
        pathname === '/plan/complete')
    ) {
      currentStep = FUNNEL_STEPS.find((step) => step.path === '/plan/plans')
    }

    // Handle FAQ page
    if (!currentStep && pathname === '/plan/faq') {
      currentStep = FUNNEL_STEPS.find((step) => step.path === '/plan/plans')
    }

    if (currentStep) {
      setProgress(currentStep.position)
    }
  }, [pathname])

  // Skip progress bar on homepage
  const showProgress = pathname !== '/plan/home'

  return (
    <div className="flex flex-col items-center min-h-screen px-4 md:px-6 pt-12 pb-16">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8">
          <HomeLink />

          {showProgress && (
            <>
              <h1 className="mt-6 text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                IP Protection Plans
              </h1>

              {/* Progress indicator */}
              <div className="mt-6">
                <Progress
                  value={progress}
                  className="h-2 bg-muted/50"
                  data-testid="funnel-progress"
                />

                {/* Step indicators */}
                <div className="flex justify-between mt-2 text-xs text-foreground/70">
                  {FUNNEL_STEPS.map((step) => (
                    <div
                      key={step.path}
                      className={`${pathname === step.path ? 'text-primary font-medium' : ''}`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
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
