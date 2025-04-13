import { NextResponse } from 'next/server'

/**
 * API endpoint that returns a filtered set of environment variables
 * specifically those prefixed with NEXT_PUBLIC_
 */
export async function GET() {
  try {
    // Get all environment variables that start with NEXT_PUBLIC_
    const publicEnvVars: Record<string, string | Record<string, unknown>> = {}

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
        if (value) {
          // Add to our response object
          publicEnvVars[newKey] = value
        }
      }
    })

    // Return the config as JSON
    return NextResponse.json(
      {
        config: publicEnvVars,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
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
