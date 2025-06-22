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

  // Hero/marketing content
  'hero.title': {
    '.net': "Because They're Your Ideas",
    '.ai': "Because It's Your Intellectual Property",
  },
  'hero.subtitle': {
    '.net':
      'Protect your intellectual property with advanced encryption, share it securely with partners, and protect your digital assets with our AI-powered agent.',
    '.ai':
      'Protect your intellectual property with advanced encryption, share it securely with partners, and defend your IP rights with our AI-powered monitoring agent.',
  },
  'hero.cta': {
    '.net': 'Start Protecting Your Ideas',
    '.ai': 'Start Protecting Your IP',
  },
  'hero.description.assets': {
    '.net': 'ideas and digital assets',
    '.ai': 'intellectual property and innovations',
  },

  // Service/feature descriptions
  'feature.description': {
    '.net':
      "From protecting trade secrets to monitoring for infringement, we're developing tools to secure, prove ownership, and profit from your intellectual property.",
    '.ai':
      'From establishing prior art to monitoring for infringement, we provide comprehensive tools to secure, prove ownership, and enforce your IP rights.',
  },

  // How it works section
  'howto.step2.title': {
    '.net': 'Upload Idea',
    '.ai': 'Upload IP Document',
  },
  'howto.step3.subtitle': {
    '.net':
      'SafeIdea AI Agents work for you to monitor the internet for unauthorized use of your intellectual property. Get comprehensive protection with continuous monitoring and detailed infringement reports.',
    '.ai':
      'SafeIdea AI Agents provide continuous monitoring of the internet for unauthorized use of your IP. Get comprehensive protection with automated scanning and detailed infringement reports.',
  },

  // CTA section
  'cta.ready': {
    '.net': 'Ready to protect your ideas?',
    '.ai': 'Ready to protect your intellectual property?',
  },
} as const

export function useVocabulary() {
  const isAISite = useFeature('ai')
  const hasIntroducedIP = useRef(false)

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
