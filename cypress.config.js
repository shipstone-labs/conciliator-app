const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(_on, _config) {},
    baseUrl: 'https://safeidea.net',
    env: {
      // Can be overridden via command line or CI variables
      BASE_URL: 'https://safeidea.net',
    },
    // Disable video recording by default to save space
    // Can be enabled with --config video=true if needed
    video: false,

    // Default screenshot behavior: only on failures
    screenshotOnRunFailure: true,

    // Viewport settings for consistent testing
    viewportWidth: 1280,
    viewportHeight: 800,

    // Timeouts to handle network conditions
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 30000,
  },
})
