'use client'

export type SubscriptionTier = 'none' | 'basic' | 'secure' | 'complete'

export interface FeatureMap {
  [feature: string]: SubscriptionTier[]
}

// Define the minimum subscription level required for each feature
export const FEATURE_ACCESS: FeatureMap = {
  // Basic features - available to all subscription tiers
  'add-ip': ['basic', 'secure', 'complete'],
  'view-ip': ['basic', 'secure', 'complete'],
  'edit-ip': ['basic', 'secure', 'complete'],

  // Sharing features - available to secure and complete tiers
  'share-ip': ['secure', 'complete'],
  'custom-nda': ['secure', 'complete'],
  'access-tracking': ['secure', 'complete'],

  // Advanced features - available only to complete tier
  'sales-agent': ['complete'],
  'ip-monitoring': ['complete'],
  'priority-support': ['complete'],
}

// Helper function to check if a feature is available for a given subscription tier
export function hasFeatureAccess(
  feature: string,
  subscriptionTier: SubscriptionTier
): boolean {
  if (!subscriptionTier || subscriptionTier === 'none') {
    return false
  }

  const allowedTiers = FEATURE_ACCESS[feature] || []
  return allowedTiers.includes(subscriptionTier)
}

// Get list of all available features for a subscription tier
export function getAvailableFeatures(
  subscriptionTier: SubscriptionTier
): string[] {
  if (!subscriptionTier || subscriptionTier === 'none') {
    return []
  }

  return Object.entries(FEATURE_ACCESS)
    .filter(([_, tiers]) => tiers.includes(subscriptionTier))
    .map(([feature, _]) => feature)
}
