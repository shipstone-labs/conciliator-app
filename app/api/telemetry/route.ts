import { type NextRequest, NextResponse } from 'next/server'
import { withTracing } from '@/lib/apiWithTracing'
import { logger } from '@/lib/tracing'

export const runtime = 'nodejs'

// This endpoint collects browser telemetry and forwards it to Google Cloud Trace
// It acts as a proxy to avoid CORS issues with direct browser-to-trace submissions
export const POST = withTracing(async (request: NextRequest) => {
  try {
    // Extract the telemetry data from the request body
    const telemetryData = await request.json()

    logger.info('Received browser telemetry', {
      resourceSpans: telemetryData.resourceSpans?.length || 0,
    })

    // Forward to Google Cloud Trace OTLP endpoint
    // In a real implementation, you would add authentication and proper headers
    const cloudTraceEndpoint =
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4317'

    const response = await fetch(cloudTraceEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telemetryData),
    })

    if (!response.ok) {
      throw new Error(`Failed to forward telemetry: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error processing telemetry', error)
    return NextResponse.json(
      { error: 'Failed to process telemetry' },
      { status: 500 }
    )
  }
})

// Support OPTIONS requests for CORS preflight
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
