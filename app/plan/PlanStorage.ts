/**
 * Utility for managing marketing funnel data storage and retrieval
 */

export const STORAGE_PREFIX = 'plan_funnel_'

/**
 * Funnel context type definition
 */
export type FunnelContext = {
  currentStep: string
  visitedPages: string[]
  assessmentAnswers: Record<string, string>
  recommendedPlan: string
  lastActivity: number
}

/**
 * Save funnel data to localStorage
 * @param key The data key (will be prefixed)
 * @param data The data to save
 */
export function saveFunnelData<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data))
  }
}

/**
 * Get funnel data from localStorage
 * @param key The data key (will be prefixed)
 * @param defaultValue Default value if no data exists
 * @returns The stored data or the default value
 */
export function getFunnelData<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
      return item ? (JSON.parse(item) as T) : defaultValue
    } catch (e) {
      console.error('Error retrieving funnel data:', e)
      return defaultValue
    }
  }
  return defaultValue
}

/**
 * Clear all funnel-related data from localStorage
 */
export function clearFunnelData(): void {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  }
}

/**
 * Track visit to a funnel page
 * @param page The page ID to track
 */
export function trackFunnelPageVisit(page: string): void {
  const visitedPages = getFunnelData<string[]>('visited_pages', [])
  if (!visitedPages.includes(page)) {
    saveFunnelData('visited_pages', [...visitedPages, page])
  }
  saveFunnelData('last_page', page)
  saveFunnelData('last_visit_time', Date.now())
}

/**
 * Get current funnel context (all critical user state information)
 * @returns FunnelContext object with current state
 */
export function getFunnelContext(): FunnelContext {
  return {
    currentStep: getFunnelData<string>('current_step', 'home'),
    visitedPages: getFunnelData<string[]>('visited_pages', []),
    assessmentAnswers: getFunnelData<Record<string, string>>(
      'assessment_answers',
      {}
    ),
    recommendedPlan: getFunnelData<string>('recommended_plan', ''),
    lastActivity: getFunnelData<number>('last_visit_time', 0),
  }
}

/**
 * Save assessment question answer
 * @param questionId The question ID
 * @param answer The selected answer
 */
export function saveAssessmentAnswer(questionId: string, answer: string): void {
  const currentAnswers = getFunnelData<Record<string, string>>(
    'assessment_answers',
    {}
  )
  saveFunnelData('assessment_answers', {
    ...currentAnswers,
    [questionId]: answer,
  })
}

/**
 * Get all assessment answers
 * @returns Record of question IDs to answers
 */
export function getAssessmentAnswers(): Record<string, string> {
  return getFunnelData<Record<string, string>>('assessment_answers', {})
}

/**
 * Set recommended plan based on assessment
 * @param planId The recommended plan ID
 */
export function setRecommendedPlan(planId: string): void {
  saveFunnelData('recommended_plan', planId)
}

/**
 * Get recommended plan
 * @returns Recommended plan ID or empty string if none
 */
export function getRecommendedPlan(): string {
  return getFunnelData<string>('recommended_plan', '')
}
