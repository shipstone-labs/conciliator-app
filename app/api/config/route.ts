import { NextResponse, type NextRequest } from 'next/server'
import { getServerConfig } from '@/lib/getServerConfig'
import { initAPIConfig } from '@/lib/apiUtils'
import { withTracing } from '@/lib/apiWithTracing'
import { logger } from '@/lib/tracing'

// Set runtime to nodejs for this API route
export const runtime = 'nodejs'

/**
 * API endpoint that returns a filtered set of environment variables
 * specifically those prefixed with NEXT_PUBLIC_
 *
 * Query parameters:
 * - reload: If set to 'true', forces a reload of environment variables from /env/.env
 */

// OPTIONS handler for the client to check if config has changed
export const OPTIONS = withTracing(async (_request: NextRequest) => {
  // Get cached hash or generate a new one
  await initAPIConfig()
  const config = await getServerConfig()

  return new NextResponse(null, {
    status: 204,
    headers: {
      ETag: `"${config.HASH}"`,
      'Last-Modified': (config.TIMESTAMP as string) || new Date().toUTCString(),
      'Cache-Control': 'max-age=0, must-revalidate',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'If-None-Match, If-Modified-Since',
    },
  })
})

export const GET = withTracing(async (request: NextRequest) => {
  await initAPIConfig()

  try {
    // Check for conditional requests
    const ifNoneMatch = request.headers.get('If-None-Match')
    const ifModifiedSince = request.headers.get('If-Modified-Since')

    // Generate or get cached config
    const config = await getServerConfig()

    // Check if we can return 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === `"${config.HASH}"`) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: `"${config.HASH}"`,
          'Last-Modified':
            (config.TIMESTAMP as string) || new Date().toUTCString(),
        },
      })
    }

    // Handle If-Modified-Since
    if (
      ifModifiedSince &&
      new Date(ifModifiedSince) >= new Date(config.TIMESTAMP as string)
    ) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: `"${config.HASH}"`,
          'Last-Modified':
            (config.TIMESTAMP as string) || new Date().toUTCString(),
        },
      })
    }

    // Return the config as JSON with caching for 1 hour (3600 seconds)
    return NextResponse.json(
      {
        config,
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
          ETag: `"${config.HASH}"`,
          'Last-Modified':
            (config.TIMESTAMP as string) || new Date().toUTCString(),
        },
      }
    )
  } catch (error) {
    logger.error('Config API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve configuration' },
      { status: 500 }
    )
  }
})
