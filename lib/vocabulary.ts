import { useFeature } from '@/hooks/useFeature'
import { useRef } from 'react'

// Define the vocabulary terms that differ between sites
const vocabularyMap = {
  // Core terms - with variations for first use, full form, and short form
  item: {
    '.net': 'Idea',
    '.ai': 'IP',
  },
  'item.first': {
    '.net': 'Idea',
    '.ai': 'Intellectual Property (IP)',
  },
  'item.full': {
    '.net': 'Idea',
    '.ai': 'Intellectual Property',
  },
  'item.plural': {
    '.net': 'Ideas',
    '.ai': 'Intellectual Property',
  },
  'item.add': {
    '.net': 'Add Idea',
    '.ai': 'Protect IP',
  },
  'item.create': {
    '.net': 'Create Idea',
    '.ai': 'Register IP',
  },
  'item.my': {
    '.net': 'My Ideas',
    '.ai': 'My IP Portfolio',
  },
  'item.explore': {
    '.net': 'Explore Ideas',
    '.ai': 'Browse IP',
  },

  // Action descriptions
  'action.upload': {
    '.net': 'Upload Your Idea',
    '.ai': 'Upload Your IP Document',
  },
  'action.encrypting': {
    '.net': 'Encrypting your idea',
    '.ai': 'Encrypting your intellectual property',
  },

  // Form placeholders
  'placeholder.title': {
    '.net': 'Enter public title for your Idea here',
    '.ai': 'Enter public title for your IP here',
  },
  'placeholder.description': {
    '.net': 'Enter public description of your Idea here',
    '.ai': 'Enter public description of your IP here',
  },

  // Page titles - introducing the acronym on first use
  'page.add.title': {
    '.net': 'Protect Your Creative Ideas',
    '.ai': 'Register Your Intellectual Property (IP)',
  },
  'page.add.description': {
    '.net': 'Secure your creative work on the blockchain',
    '.ai': 'Establish prior art and protect your IP rights',
  },

  // Step descriptions
  'step.content.title': {
    '.net': 'Securely Save Your Idea',
    '.ai': 'Securely Save Your IP',
  },
  'step.content.description': {
    '.net':
      'Now you need to add the secret document that describes your idea in detail. This is the core of your intellectual property protection.',
    '.ai':
      'Now you need to add the secret document that describes your intellectual property in detail. This is the core of your IP protection.',
  },

  // Subscription page terms
  'subscription.hero.title': {
    '.net': 'Because Your Ideas Are Worth Protecting',
    '.ai': 'Because Your Intellectual Property Needs Professional Protection',
  },
  'subscription.protect.cta': {
    '.net': 'Protect My Idea Now',
    '.ai': 'Secure My IP Now',
  },
  'subscription.innovative': {
    '.net': 'Your IP Protection Should Be As Innovative As Your Ideas',
    '.ai':
      'Your IP Protection Should Be As Innovative As Your Intellectual Property',
  },
  'subscription.ready': {
    '.net': 'Ready to Protect Your Innovative Ideas?',
    '.ai': 'Ready to Protect Your Intellectual Property?',
  },
} as const

export function useVocabulary() {
  const isAISiteFeature = useFeature('ai')
  const hasIntroducedIP = useRef(false)

  // Check both feature flag and URL (fallback for PR previews where env vars aren't set)
  const isAISite =
    isAISiteFeature ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('conciliator-ai') ||
        window.location.hostname.includes('app.safeidea.ai')))

  const getTerm = (
    key: keyof typeof vocabularyMap,
    options?: { forceVariant?: 'first' | 'full' | 'short' }
  ): string => {
    const site = isAISite ? '.ai' : '.net'

    // Handle special case for IP/Intellectual Property on .ai site
    if (isAISite && key === 'item' && !options?.forceVariant) {
      // First usage on the page should be "Intellectual Property (IP)"
      if (!hasIntroducedIP.current) {
        hasIntroducedIP.current = true
        return vocabularyMap['item.first'][site]
      }
      // After introduction, prefer short form but mix in full form occasionally
      // This is a simple implementation - could be made more sophisticated
      return Math.random() > 0.7
        ? vocabularyMap['item.full'][site]
        : vocabularyMap.item[site]
    }

    // Handle forced variants
    if (
      options?.forceVariant === 'first' &&
      vocabularyMap[`${key}.first` as keyof typeof vocabularyMap]
    ) {
      return vocabularyMap[`${key}.first` as keyof typeof vocabularyMap][site]
    }
    if (
      options?.forceVariant === 'full' &&
      vocabularyMap[`${key}.full` as keyof typeof vocabularyMap]
    ) {
      return vocabularyMap[`${key}.full` as keyof typeof vocabularyMap][site]
    }

    return vocabularyMap[key][site]
  }

  // Reset the introduction tracker (useful when navigating between pages)
  const resetIntroduction = () => {
    hasIntroducedIP.current = false
  }

  return { getTerm, resetIntroduction }
}
