/**
 * Defines the steps in the marketing funnel and their progression
 */

/**
 * Funnel step definition
 */
export type FunnelStep = {
  id: string
  path: string
  label: string
  position: number
  requiredForProgression: boolean
}

/**
 * Marketing funnel steps and their positions for the progress indicator
 */
export const FUNNEL_STEPS: FunnelStep[] = [
  {
    id: 'home',
    path: '/plan/home',
    label: 'Start',
    position: 0,
    requiredForProgression: false,
  },
  {
    id: 'how-it-works',
    path: '/plan/how-it-works',
    label: 'Learn',
    position: 20,
    requiredForProgression: false,
  },
  {
    id: 'assessment',
    path: '/plan/assessment',
    label: 'Assess',
    position: 40,
    requiredForProgression: true,
  },
  {
    id: 'plans',
    path: '/plan/plans',
    label: 'Compare',
    position: 60,
    requiredForProgression: true,
  },
  {
    id: 'signup',
    path: '/plan/signup',
    label: 'Sign Up',
    position: 80,
    requiredForProgression: true,
  },
  {
    id: 'success',
    path: '/plan/success',
    label: 'Complete',
    position: 100,
    requiredForProgression: false,
  },
]

/**
 * Calculate funnel progress based on current step ID
 * @param currentStepId The ID of the current step
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(currentStepId: string): number {
  const step = FUNNEL_STEPS.find((s) => s.id === currentStepId)
  if (!step) return 0

  return step.position
}

/**
 * Get step ID from pathname
 * @param pathname The current path
 * @returns Step ID or undefined if not found
 */
export function getStepFromPath(pathname: string): string | undefined {
  const step = FUNNEL_STEPS.find((step) => step.path === pathname)
  if (!step) {
    // Handle plan detail pages
    if (
      pathname === '/plan/basic' ||
      pathname === '/plan/secure' ||
      pathname === '/plan/complete'
    ) {
      return 'plans'
    }

    // Handle FAQ page
    if (pathname === '/plan/faq') {
      return 'plans'
    }

    return undefined
  }

  return step.id
}

/**
 * Get the next step in the funnel
 * @param currentStepId The current step ID
 * @returns The next step or undefined if at the end
 */
export function getNextStep(currentStepId: string): FunnelStep | undefined {
  const currentIndex = FUNNEL_STEPS.findIndex(
    (step) => step.id === currentStepId
  )
  if (currentIndex === -1 || currentIndex === FUNNEL_STEPS.length - 1) {
    return undefined
  }

  return FUNNEL_STEPS[currentIndex + 1]
}
