import { useConfig } from '@/components/AuthLayout'

export type Feature =
  | 'stripe'
  | 'stytch'
  | 'lit'
  | 'lilypad'
  | 'openai'
  | 'storacha'
  | 'firestore'
  | 'firebase'
  | 'bucket'
  | 'net'
  | 'ai'

export function useFeatures(): Partial<Record<Feature, boolean>> {
  const config = useConfig()
  // This is a placeholder implementation.
  // In a real application, you would replace this with logic to check if the feature is enabled.
  const enabledFeatures = ((config.FEATURES as string) || '')
    .split(',')
    .filter(Boolean) as Feature[] // Example list of enabled features
  return Object.fromEntries(
    enabledFeatures.map((feature) => [feature, true] as [Feature, boolean])
  )
}

export function useFeature(featureName: string): boolean {
  const enabledFeatures = useFeatures()
  return (
    (featureName in enabledFeatures && (enabledFeatures as any)[featureName]) ??
    false
  )
}
