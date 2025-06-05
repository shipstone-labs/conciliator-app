/**
 * Device Configuration for Multi-Device Testing
 * Defines devices, viewports, and critical paths for each device type
 */

const { devices } = require('playwright')

// Device profiles for testing
const DEVICE_PROFILES = {
  // Desktop
  desktop: {
    name: 'Desktop Chrome',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },

  // Mobile devices
  'iphone-14-pro': {
    ...devices['iPhone 14 Pro'],
    name: 'iPhone 14 Pro',
  },

  'iphone-se': {
    ...devices['iPhone SE'],
    name: 'iPhone SE',
  },

  'pixel-7': {
    ...devices['Pixel 7'],
    name: 'Pixel 7',
  },

  'galaxy-s23': {
    name: 'Galaxy S23',
    viewport: { width: 360, height: 780 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  // Tablets
  'ipad-pro': {
    ...devices['iPad Pro 11'],
    name: 'iPad Pro 11',
  },

  'galaxy-tab': {
    name: 'Galaxy Tab S8',
    viewport: { width: 800, height: 1280 },
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-X706B) AppleWebKit/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
}

// Critical paths for mobile testing (reduced set for efficiency)
const MOBILE_CRITICAL_PATHS = [
  { path: '/', name: 'Homepage', priority: 1 },
  { path: '/subscription/home', name: 'Subscription Home', priority: 1 },
  { path: '/subscription/assessment', name: 'Assessment', priority: 1 },
  { path: '/subscription/plans', name: 'Plans', priority: 1 },
  { path: '/subscription/faq', name: 'FAQ', priority: 2 },
  { path: '/subscription/signup', name: 'Signup', priority: 2 },
]

// Full paths for desktop testing
const DESKTOP_PATHS = [
  { path: '/', name: 'Homepage' },
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
  { path: '/portfolio-interest', name: 'Portfolio Interest' },
]

// Device testing groups for parallel execution
const DEVICE_GROUPS = {
  mobile: ['iphone-14-pro', 'pixel-7'],
  tablet: ['ipad-pro'],
  desktop: ['desktop'],
}

// Mobile-specific TestID patterns to look for
const MOBILE_UI_PATTERNS = {
  hamburgerMenu: /menu|burger|nav-toggle/i,
  mobileOnly: /mobile|touch|swipe/i,
  responsive: /responsive|collapse|expand/i,
}

module.exports = {
  DEVICE_PROFILES,
  MOBILE_CRITICAL_PATHS,
  DESKTOP_PATHS,
  DEVICE_GROUPS,
  MOBILE_UI_PATTERNS,
}
