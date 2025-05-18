export type StorageStatus = 'available' | 'unavailable' | 'error'

const STORAGE_PREFIX = 'subscription_data_'

/**
 * Check if localStorage is available and working
 * @returns Status of localStorage
 */
export function checkStorageAvailability(): StorageStatus {
  try {
    const testKey = `${STORAGE_PREFIX}test`
    localStorage.setItem(testKey, 'test')
    const testValue = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)

    return testValue === 'test' ? 'available' : 'unavailable'
  } catch (_e) {
    return 'error'
  }
}

/**
 * Save data to localStorage with error handling
 * @param key The data key (will be prefixed)
 * @param data The data to save
 * @returns Success status and any error
 */
export function saveData<T>(
  key: string,
  data: T
): { success: boolean; error?: Error } {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`
    localStorage.setItem(fullKey, JSON.stringify(data))
    return { success: true }
  } catch (e) {
    console.error('Error saving data to localStorage:', e)
    return {
      success: false,
      error:
        e instanceof Error
          ? e
          : new Error('Unknown error saving to localStorage'),
    }
  }
}

/**
 * Get data from localStorage with error handling
 * @param key The data key (will be prefixed)
 * @param defaultValue Default value if no data exists
 * @returns The data, success status, and any error
 */
export function getData<T>(
  key: string,
  defaultValue: T
): {
  data: T
  success: boolean
  error?: Error
} {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`
    const item = localStorage.getItem(fullKey)

    if (!item) {
      return { data: defaultValue, success: true }
    }

    return {
      data: JSON.parse(item) as T,
      success: true,
    }
  } catch (e) {
    console.error('Error retrieving data from localStorage:', e)
    return {
      data: defaultValue,
      success: false,
      error:
        e instanceof Error
          ? e
          : new Error('Unknown error reading from localStorage'),
    }
  }
}

/**
 * Clear all subscription-related data from localStorage
 * @returns Success status and any error
 */
export function clearAllData(): { success: boolean; error?: Error } {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
    return { success: true }
  } catch (e) {
    console.error('Error clearing localStorage data:', e)
    return {
      success: false,
      error:
        e instanceof Error
          ? e
          : new Error('Unknown error clearing localStorage'),
    }
  }
}

/**
 * Save assessment answer with error handling
 * @param questionId The question ID
 * @param answer The selected answer
 * @returns Success status and any error
 */
export function saveAnswer(
  questionId: string,
  answer: string
): {
  success: boolean
  error?: Error
} {
  // Get current answers
  const {
    data: currentAnswers,
    success: getSuccess,
    error: getError,
  } = getData<Record<string, string>>('assessment_answers', {})

  if (!getSuccess) {
    return { success: false, error: getError }
  }

  // Update answers
  const updatedAnswers = {
    ...currentAnswers,
    [questionId]: answer,
  }

  // Save updated answers
  return saveData('assessment_answers', updatedAnswers)
}

/**
 * Get all assessment answers with error handling
 * @returns Answers, success status, and any error
 */
export function getAnswers(): {
  data: Record<string, string>
  success: boolean
  error?: Error
} {
  return getData<Record<string, string>>('assessment_answers', {})
}

/**
 * Save recommended plan with error handling
 * @param planId The recommended plan ID
 * @returns Success status and any error
 */
export function saveRecommendedPlan(planId: string): {
  success: boolean
  error?: Error
} {
  return saveData('recommended_plan', planId)
}

/**
 * Get recommended plan with error handling
 * @returns Recommended plan, success status, and any error
 */
export function getRecommendedPlan(): {
  data: string
  success: boolean
  error?: Error
} {
  return getData<string>('recommended_plan', '')
}

/**
 * Track visit to a funnel page
 * @param page The page ID to track
 */
export function trackFunnelPageVisit(page: string): {
  success: boolean
  error?: Error
} {
  // Get visited pages
  const {
    data: visitedPages,
    success: getSuccess,
    error: getError,
  } = getData<string[]>('visited_pages', [])

  if (!getSuccess) {
    return { success: false, error: getError }
  }

  // Update visited pages if this is a new page
  if (!visitedPages.includes(page)) {
    const saveResult = saveData('visited_pages', [...visitedPages, page])
    if (!saveResult.success) {
      return saveResult
    }
  }

  // Save last page and visit time
  const lastPageResult = saveData('last_page', page)
  if (!lastPageResult.success) {
    return lastPageResult
  }

  return saveData('last_visit_time', Date.now())
}
