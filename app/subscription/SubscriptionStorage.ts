'use client'

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useStytchUser } from '@stytch/nextjs'
import type { SubscriptionTier } from './FeatureAccess'

// Storage for non-authenticated users (localStorage)
const STORAGE_PREFIX = 'subscription_data_'

/**
 * Save funnel data to localStorage for non-authenticated users
 * @param key The data key (will be prefixed)
 * @param data The data to save
 */
export function saveLocalData<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    const fullKey = `${STORAGE_PREFIX}${key}`
    const dataStr = JSON.stringify(data)
    console.log(`DEBUG-STORAGE: Saving data to ${fullKey}:`, dataStr)
    localStorage.setItem(fullKey, dataStr)
    
    // Verify the data was actually saved
    const savedData = localStorage.getItem(fullKey)
    console.log(`DEBUG-STORAGE: Verification read from ${fullKey}:`, savedData)
    console.log('DEBUG-STORAGE: Save successful:', savedData === dataStr)
  }
}

/**
 * Get funnel data from localStorage for non-authenticated users
 * @param key The data key (will be prefixed)
 * @param defaultValue Default value if no data exists
 * @returns The stored data or the default value
 */
export function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`
      console.log(`DEBUG-STORAGE: Reading data from ${fullKey}`)
      const item = localStorage.getItem(fullKey)
      console.log(`DEBUG-STORAGE: Raw data from ${fullKey}:`, item)
      
      if (item) {
        const parsedData = JSON.parse(item) as T
        console.log(`DEBUG-STORAGE: Parsed data from ${fullKey}:`, parsedData)
        return parsedData
      }
      console.log(`DEBUG-STORAGE: No data found for ${fullKey}, using default:`, defaultValue)
      return defaultValue
    } catch (e) {
      console.error('Error retrieving subscription data:', e)
      return defaultValue
    }
  }
  return defaultValue
}

/**
 * Clear all subscription-related data from localStorage
 */
export function clearLocalData(): void {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  }
}

/**
 * Clear all funnel-related data from localStorage
 * This is for backward compatibility with the funnel flow
 */
export function clearFunnelData(): void {
  clearLocalData()
}

/**
 * Track visit to a funnel page
 * @param page The page ID to track
 */
export function trackFunnelPageVisit(page: string): void {
  // For non-authenticated users, store in localStorage
  const visitedPages = getLocalData<string[]>('visited_pages', [])
  if (!visitedPages.includes(page)) {
    saveLocalData('visited_pages', [...visitedPages, page])
  }
  saveLocalData('last_page', page)
  saveLocalData('last_visit_time', Date.now())
}

/**
 * Save assessment question answer
 * @param questionId The question ID
 * @param answer The selected answer
 */
export function saveAssessmentAnswer(questionId: string, answer: string): void {
  console.log(`DEBUG-ASSESSMENT: Saving answer for question ${questionId}:`, answer)
  
  const currentAnswers = getLocalData<Record<string, string>>(
    'assessment_answers',
    {}
  )
  console.log('DEBUG-ASSESSMENT: Current answers before update:', currentAnswers)
  
  const updatedAnswers = {
    ...currentAnswers,
    [questionId]: answer,
  }
  console.log('DEBUG-ASSESSMENT: Updated answers to save:', updatedAnswers)
  
  saveLocalData('assessment_answers', updatedAnswers)
  
  // Double-check the save by reading it back
  const verifiedAnswers = getLocalData<Record<string, string>>('assessment_answers', {})
  console.log('DEBUG-ASSESSMENT: Verified answers after save:', verifiedAnswers)
  console.log(`DEBUG-ASSESSMENT: Answer save verification for ${questionId}:`, 
              verifiedAnswers[questionId] === answer ? 'SUCCESS' : 'FAILED')
}

/**
 * Get all assessment answers
 * @returns Record of question IDs to answers
 */
export function getAssessmentAnswers(): Record<string, string> {
  return getLocalData<Record<string, string>>('assessment_answers', {})
}

/**
 * Set recommended plan based on assessment
 * @param planId The recommended plan ID
 */
export function setRecommendedPlan(planId: string): void {
  saveLocalData('recommended_plan', planId)
}

/**
 * Get recommended plan
 * @returns Recommended plan ID or empty string if none
 */
export function getRecommendedPlan(): string {
  return getLocalData<string>('recommended_plan', '')
}

/**
 * User Subscription Management
 */

// Firebase collection name for user subscriptions
const SUBSCRIPTION_COLLECTION = 'user_subscriptions'

/**
 * Get a user's subscription data from Firestore
 * @param userId The user ID
 * @returns The subscription data or null if not found
 */
export async function getUserSubscription(userId: string): Promise<{
  tier: SubscriptionTier
  startDate: number
  endDate: number | null
  status: 'active' | 'cancelled' | 'expired'
  paymentMethod: string | null
} | null> {
  try {
    if (!userId) return null

    const db = getFirestore()
    const docRef = doc(db, SUBSCRIPTION_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as {
        tier: SubscriptionTier
        startDate: number
        endDate: number | null
        status: 'active' | 'cancelled' | 'expired'
        paymentMethod: string | null
      }
    }

    // No subscription found for user
    return null
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return null
  }
}

/**
 * Set a user's subscription in Firestore
 * @param userId The user ID
 * @param subscription The subscription data
 */
export async function setUserSubscription(
  userId: string,
  subscription: {
    tier: SubscriptionTier
    startDate: number
    endDate: number | null
    status: 'active' | 'cancelled' | 'expired'
    paymentMethod: string | null
  }
): Promise<boolean> {
  try {
    if (!userId) return false

    const db = getFirestore()
    const docRef = doc(db, SUBSCRIPTION_COLLECTION, userId)

    // Check if document exists
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      // Update existing subscription
      await updateDoc(docRef, subscription)
    } else {
      // Create new subscription
      await setDoc(docRef, subscription)
    }

    return true
  } catch (error) {
    console.error('Error setting user subscription:', error)
    return false
  }
}

/**
 * Hook to get the current user's subscription
 * @returns The current subscription or null if no user or subscription
 */
export function useUserSubscription() {
  const { user } = useStytchUser()
  const [subscription, setSubscription] = useState<{
    tier: SubscriptionTier
    startDate: number
    endDate: number | null
    status: 'active' | 'cancelled' | 'expired'
    paymentMethod: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        if (!user) {
          setSubscription(null)
          setLoading(false)
          return
        }

        const userId = user.user_id
        const userSubscription = await getUserSubscription(userId)
        setSubscription(userSubscription)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  return { subscription, loading, error }
}

// Fix missing imports
import { useState, useEffect } from 'react'
