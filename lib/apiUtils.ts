// Default runtime to Node.js for all API routes that import this file
export const runtime = 'nodejs'

// Import the server config initialization function
import { getServerConfig } from './getServerConfig'

/**
 * Initialize the server configuration for API routes
 * Call this at the beginning of API route handlers
 */
export async function initAPIConfig() {
  try {
    await getServerConfig()
    return true
  } catch (error) {
    console.error('Failed to initialize API config:', error)
    return false
  }
}
