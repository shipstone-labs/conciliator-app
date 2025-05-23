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
    // Step 1: Upload content
    fileUploadZone: 'file-upload-zone',
    fileUploadInput: 'file-upload-input',
    addEncryptButton: 'add-encrypt-button',
    // Step 2: Public details
    titleInput: 'idea-title-input',
    descriptionInput: 'idea-description-input',
    // Step 3: Terms and AI agent
    setTermsButton: 'set-terms-button',
    createButton: 'create-idea-button',
    aiAgentCheckbox: 'ai-agent-checkbox',
    // Terms dialog
    termsDialog: 'terms-dialog',
    termsContent: 'terms-content',
    businessModelSelect: 'business-model-select',
    businessModelOption: (id: string) => `ip-business-model-option-${id}`,
    termsAcceptButton: 'terms-accept-button',
    // Navigation
    nextButton: 'next-step-button',
    prevButton: 'prev-step-button',
    // Status and loading
    statusMessage: 'add-idea-status-message',
    loadingSpinner: 'add-idea-loading-spinner',
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
