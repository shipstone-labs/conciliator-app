/**
 * Known public routes for SafeIdea
 * Based on the page.tsx files found in the app directory
 */

const SAFEIDEA_PUBLIC_ROUTES = [
  // Homepage
  { path: '/', name: 'Homepage' },

  // Subscription pages
  { path: '/subscription/home', name: 'Subscription Home' },
  { path: '/subscription/assessment', name: 'Assessment' },
  { path: '/subscription/plans', name: 'Plans' },
  { path: '/subscription/basic', name: 'Basic Plan' },
  { path: '/subscription/secure', name: 'Secure Plan' },
  { path: '/subscription/complete', name: 'Complete Plan' },
  { path: '/subscription/how-it-works', name: 'How It Works' },
  { path: '/subscription/faq', name: 'FAQ' },
  { path: '/subscription/signup', name: 'Signup' },
  { path: '/subscription/success', name: 'Success' },

  // Other public pages
  { path: '/portfolio-interest', name: 'Portfolio Interest' },
]

// Map TestIDs to their likely destination routes
const TESTID_ROUTE_MAP = {
  'plan-basic-button': '/subscription/basic',
  'plan-secure-button': '/subscription/secure',
  'plan-complete-button': '/subscription/complete',
  'plan-portfolio-button': '/portfolio-interest',
  'welcome-how-it-works-link': '/subscription/how-it-works',
  'plan-primary-cta': '/subscription/assessment',
  'plan-final-cta': '/subscription/plans',
}

module.exports = {
  SAFEIDEA_PUBLIC_ROUTES,
  TESTID_ROUTE_MAP,
}
