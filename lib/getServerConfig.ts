import type { AppConfig } from './ConfigContext'
import { cookies, headers } from 'next/headers'

let currentConfig: Promise<AppConfig> | undefined

/**
 * Gets the application configuration safely in Next.js environment
 * - For dynamic requests: directly reads from environment variables
 * - For static generation: ensures we only use safe fallbacks
 */
async function _getServerConfig(): Promise<AppConfig> {
  // Check if we're in a dynamic rendering context by attempting to read headers or cookies
  // This will throw an error during static generation, which we can catch
  let isDynamicRequest = false
  try {
    // Try to read headers or cookies to determine if we're in a dynamic request
    headers()
    cookies()
    isDynamicRequest = true
  } catch {
    // We're in static generation mode
    console.log('Running in static generation mode, using API for config')
  }

  // In a dynamic request, we can safely read environment variables
  if (isDynamicRequest) {
    // Get all environment variables that start with NEXT_PUBLIC_
    const publicEnvVars: AppConfig = {}

    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        // Remove the NEXT_PUBLIC_ prefix
        const newKey = key.replace('NEXT_PUBLIC_', '')

        // Get the value
        let value = process.env[key]

        // Special handling for FIREBASE_CONFIG - parse as JSON if it's valid
        if (key === 'NEXT_PUBLIC_FIREBASE_CONFIG' && value) {
          try {
            value = JSON.parse(value)
          } catch (error) {
            console.error(`Failed to parse FIREBASE_CONFIG as JSON: ${error}`)
            // Keep as string if parsing fails
          }
        }

        // Add to our response object
        publicEnvVars[newKey] = value
      }
    })

    return publicEnvVars
  }

  // For static generation, return a minimal safe config
  // This will be replaced by the actual config on the client side
  // Using the API or during hydration
  return {
    // Include only safe defaults for static generation
    // These should be public values that can be embedded in static HTML
    ENV: 'static',
  }
}

export async function getServerConfig(): Promise<AppConfig> {
  // Check if we already have the config cached
  if (currentConfig) {
    return currentConfig
  }

  // Get the server config
  const config = _getServerConfig()

  // Cache the config for future requests
  currentConfig = config

  return await config
}
