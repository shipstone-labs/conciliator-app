/**
 * Utility for managing journey data storage and retrieval
 */

/**
 * Save journey data to localStorage
 * @param key The data key (will be prefixed with 'journey_')
 * @param data The data to save
 */
export function saveJourneyData(key: string, data: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`journey_${key}`, JSON.stringify(data))
  }
}

/**
 * Get journey data from localStorage
 * @param key The data key (will be prefixed with 'journey_')
 * @param defaultValue Default value if no data exists
 * @returns The stored data or the default value
 */
export function getJourneyData<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`journey_${key}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Error parsing stored journey data', e)
      }
    }
  }
  return defaultValue
}

/**
 * Clear all journey-related data from localStorage
 */
export function clearJourneyData() {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('journey_'))
      .forEach((key) => localStorage.removeItem(key))
  }
}

/**
 * Journey step names and their positions for the progress indicator
 */
export const JOURNEY_STEPS = [
  { path: '/journey/start', label: 'Start', position: 0 },
  { path: '/journey/document', label: 'Document', position: 20 },
  { path: '/journey/provisional', label: 'Provisional', position: 40 },
  { path: '/journey/share', label: 'Share', position: 60 },
  { path: '/journey/manage', label: 'Manage', position: 80 },
  { path: '/journey/enforce', label: 'Enforce', position: 100 },
]

/**
 * Get the current progress percentage based on pathname
 * @param pathname The current path
 * @returns Progress percentage (0-100)
 */
export function getJourneyProgress(pathname: string): number {
  const currentStep = JOURNEY_STEPS.find((step) => step.path === pathname)
  return currentStep ? currentStep.position : 0
}

/**
 * Mark a journey step as completed
 * @param step The step name to mark as completed
 */
export function markStepComplete(step: string) {
  const completedSteps = getJourneyData<string[]>('completed_steps', [])
  if (!completedSteps.includes(step)) {
    saveJourneyData('completed_steps', [...completedSteps, step])
  }
}

/**
 * Check if a journey step has been completed
 * @param step The step name to check
 * @returns True if the step has been completed
 */
export function isStepComplete(step: string): boolean {
  const completedSteps = getJourneyData<string[]>('completed_steps', [])
  return completedSteps.includes(step)
}
