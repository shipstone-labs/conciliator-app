import type { RawAppConfig } from './ConfigContext'
import { cookies, headers } from 'next/headers'
import { config } from 'dotenv'

// Use a special marker to indicate this is server-only code
// This prevents Next.js from bundling it for client-side use
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Add a global variable to track when environment was last reloaded
declare global {
  // eslint-disable-next-line no-var
  var __ENV_NEXT_RELOAD: number
  // eslint-disable-next-line no-var
  var __ENV_PATH: string | undefined
  // eslint-disable-next-line no-var
  var __ENV_EXISTS: boolean
  // eslint-disable-next-line no-var
  var __ENV_INITIALIZED: boolean
}

// Initialize last reload time if not set
if (!global.__ENV_NEXT_RELOAD) {
  global.__ENV_NEXT_RELOAD = Date.now() // Initially do it now
  global.__ENV_INITIALIZED = false // Flag to check if initialized
}

// Only run the following code on the server
let currentConfig: Promise<RawAppConfig> | undefined
let configTimestamp = 0

/**
 * Gets the application configuration safely in Next.js environment
 * - For dynamic requests: directly reads from environment variables
 * - For static generation: ensures we only use safe fallbacks
 */
async function _getServerConfig(): Promise<RawAppConfig> {
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
  }

  // In a dynamic request, we can safely read environment variables
  if (isDynamicRequest) {
    // Get all environment variables that start with NEXT_PUBLIC_
    const publicEnvVars: RawAppConfig = {} as unknown as RawAppConfig

    Object.keys(process.env).forEach((key) => {
      const isFileCoin = key.startsWith('FILCOIN_CONTRACT')
      if (
        key.startsWith('NEXT_PUBLIC_') ||
        isFileCoin ||
        ['STYTCH_APP_ID', 'FIREBASE_CONFIG', 'STYTCH_PUBLIC_TOKEN'].includes(
          key
        )
      ) {
        // Only log in development and only occasionally

        // Remove the NEXT_PUBLIC_ prefix
        const newKey = isFileCoin
          ? key.replace('FILCOIN_', '')
          : key.replace('NEXT_PUBLIC_', '')

        // Get the value
        let value = process.env[key]

        // Special handling for FIREBASE_CONFIG - parse as JSON if it's valid
        if (newKey === 'FIREBASE_CONFIG' && value) {
          try {
            value = JSON.parse(value)
          } catch (error) {
            console.error(`Failed to parse FIREBASE_CONFIG as JSON: ${error}`)
            // Keep as string if parsing fails
          }
        }
        if (value) {
          // Add to our response object
          publicEnvVars[newKey] = value
        }
      }
    })

    // Return the full config with a flag indicating it's from server
    return {
      ...publicEnvVars,
      ENV: 'server',
    } as unknown as RawAppConfig
  }

  // For static generation, return a minimal safe config
  // This will be replaced by the actual config on the client side
  // Using the API or during hydration
  return {
    // Include only safe defaults for static generation
    // These should be public values that can be embedded in static HTML
    ENV: 'static',
  } as unknown as RawAppConfig
}

/**
 * Gets the server configuration, optionally forcing a reload of environment variables
 * @param forceReload Whether to force reload environment variables from .env file
 * @returns Promise resolving to the application configuration
 */
export async function getServerConfig(
  forceReload = false
): Promise<RawAppConfig> {
  // Check if env was reloaded elsewhere (by another process/request)
  if (
    typeof window === 'undefined' && // Only run on server
    (Date.now() >= global.__ENV_NEXT_RELOAD ||
      forceReload ||
      !global.__ENV_INITIALIZED) // Check if we need to reload
  ) {
    try {
      // Dynamically import node:fs only on the server
      // biome-ignore lint/style/useNodejsImportProtocol: <explanation>
      const fs = await import('fs')
      // biome-ignore lint/style/useNodejsImportProtocol: <explanation>
      const path = await import('path')
      global.__ENV_INITIALIZED = true

      let filePath = process.cwd()
      if (filePath.endsWith('.next/standalone')) {
        filePath = path.resolve(filePath, '../..')
      }
      const localPath = path.resolve(filePath, '.env.local')
      if (!global.__ENV_PATH) {
        global.__ENV_PATH = fs.existsSync(localPath)
          ? localPath
          : fs.existsSync('/env/.env')
            ? '/env/.env'
            : undefined
        global.__ENV_EXISTS = !!global.__ENV_PATH
      }
      if (!global.__ENV_EXISTS) {
        global.__ENV_NEXT_RELOAD = Date.now() + 1000 * 3600
        currentConfig = Promise.resolve({
          ENV: 'static',
        } as unknown as RawAppConfig)
        console.log('No environment file found, using static config')
        return currentConfig
      }
      const stat = fs.statSync(global.__ENV_PATH as string)
      if (stat.mtimeMs > configTimestamp) {
        // Environment file was modified, update the timestamp
        config({ path: global.__ENV_PATH as string, override: true })
        configTimestamp = stat.mtimeMs
      }
      // Environment was reloaded, clear the cache
      global.__ENV_NEXT_RELOAD = Date.now() + 1000 * 3600
      currentConfig = undefined
    } catch (error) {
      console.error('Error checking environment file:', error)
    }
  }

  // Check if we already have the config cached
  if (currentConfig) {
    return currentConfig
  }

  // Get the server config
  const appConfig = _getServerConfig()

  // Cache the config for future requests (cache invalidates when server restarts or env reloaded)
  currentConfig = appConfig

  return await appConfig
}
