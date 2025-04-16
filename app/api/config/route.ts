import { NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/getServerConfig'
import { initAPIConfig } from '@/lib/apiUtils'

// Set runtime to nodejs for this API route
export const runtime = 'nodejs'

/**
 * API endpoint that returns a filtered set of environment variables
 * specifically those prefixed with NEXT_PUBLIC_
 *
 * Query parameters:
 * - reload: If set to 'true', forces a reload of environment variables from /env/.env
 */
export async function GET(request: Request) {
  await initAPIConfig()

  // Check if we need to reload environment variables
  const url = new URL(request.url)
  const shouldReload = url.searchParams.get('reload') === 'true'

  if (shouldReload) {
    // Force reload of environment variables
    await getServerConfig(true)
  }
  try {
    // Get all environment variables that start with NEXT_PUBLIC_
    const publicEnvVars: Record<string, string | Record<string, unknown>> = {}

    Object.keys(process.env).forEach((key) => {
      const isFileCoin = key.startsWith('FILCOIN_CONTRACT')
      if (
        key.startsWith('NEXT_PUBLIC_') ||
        isFileCoin ||
        ['STYTCH_APP_ID', 'FIREBASE_CONFIG'].includes(key)
      ) {
        console.log(`Key: ${key}, Value: ${process.env[key]}`)
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

    // Return the config as JSON with caching for 1 hour (3600 seconds)
    return NextResponse.json(
      {
        config: publicEnvVars,
        timestamp: new Date().toISOString(),
        source: 'api',
      },
      {
        headers: {
          // In production: Cache for 1 hour, stale-while-revalidate for another hour
          // In development: No caching
          'Cache-Control':
            process.env.NODE_ENV === 'production'
              ? 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600'
              : 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve configuration' },
      { status: 500 }
    )
  }
}
