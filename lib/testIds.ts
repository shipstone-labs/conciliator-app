/**
 * Centralized test IDs for consistent testing
 * This file provides a single source of truth for all test identifiers
 */

export const testIds = {
  nav: {
    logo: 'nav-logo',
    dashboard: 'nav-dashboard',
    addIdea: 'nav-add-idea',
    listIdeas: 'nav-list-ideas',
    account: 'nav-account',
    signIn: 'nav-sign-in',
    signOut: 'nav-sign-out',
  },
  assessment: {
    form: 'assessment-form',
    question: (id: string) => `question-${id}`,
    option: (id: string) => `option-${id}`,
    nextButton: 'next-question-button',
    prevButton: 'prev-question-button',
    results: 'assessment-results',
  },
  addIdea: {
    form: 'add-idea-form',
    titleInput: 'idea-title-input',
    descriptionInput: 'idea-description-input',
    nextButton: 'next-step-button',
    prevButton: 'prev-step-button',
    createButton: 'create-idea-button',
  },
  common: {
    modal: 'modal-container',
    modalClose: 'modal-close-button',
    loading: 'loading-indicator',
    error: 'error-message',
    success: 'success-message',
  },
} as const

// Type helper to ensure type safety when using test IDs
export type TestIds = typeof testIds
