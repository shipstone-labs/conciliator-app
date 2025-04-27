import { type NextRequest, NextResponse } from 'next/server'
import { withAPITracing } from '@/lib/apiWithTracing'
import { logger } from '@/lib/tracing'
import { forwardBrowserTelemetryToGCP } from '@/lib/server-tracing'

export const runtime = 'nodejs'

// This endpoint collects browser telemetry and forwards it to Google Cloud Trace
// It acts as a proxy to avoid CORS issues with direct browser-to-trace submissions
export const POST = withAPITracing(async (request: NextRequest) => {
  try {
    // Extract the telemetry data from the request body
    const telemetryData = await request.json()

    logger.info('Received browser telemetry', {
      resourceSpans: telemetryData.resourceSpans?.length || 0,
    })

    // Try to use the GCP TraceExporter directly for browser telemetry
    const gcpExportSuccess = await forwardBrowserTelemetryToGCP(telemetryData)

    // If using GCP exporter was successful, we're done
    if (gcpExportSuccess) {
      logger.info('Browser telemetry successfully exported to GCP Trace')
      return NextResponse.json({ success: true })
    }

    // Fallback to standard OTLP exporter if GCP export failed or we're not in GCP
    logger.info('Using fallback OTLP exporter for browser telemetry')
    const cloudTraceEndpoint =
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      'http://localhost:4318/v1/traces'

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

    logger.info('Browser telemetry forwarded to OTLP endpoint')
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
