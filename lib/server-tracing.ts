// Server-side only imports - these will never be bundled for the browser
import { NodeSDK } from '@opentelemetry/sdk-node'
// Use the HTTP exporter instead of the gRPC (proto) exporter to avoid protocol mismatches
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { resourceFromAttributes } from '@opentelemetry/resources'
// Import the GCP trace exporter
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter'
// We need to do a try/catch import for the gRPC instrumentation
// to handle cases where the module can't be loaded
let GrpcInstrumentation: any

async function isRunningInGCP(): Promise<false | string> {
  if (process.env.FORCE_GCP_FOR_TESTING) {
    return 'localhost'
  }
  try {
    const response = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/region',
      { headers: { 'Metadata-Flavor': 'Google' } }
    )
    if (response.ok) {
      const result = await response.text()
      console.log('OpenTelemetry: Detected GCP environment, region:', result)
      return result
    }
    return false
  } catch {
    return false
  }
}

export const runtime = 'nodejs'

// Define attribute keys (standard, not deprecated)
const ATTR_SERVICE_NAME = 'service.name'
const ATTR_SERVICE_VERSION = 'service.version'
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment'

// Global variable to track initialization state
let isInitialized = false
let sdk: NodeSDK | undefined
let gcpTraceExporter: TraceExporter | undefined

// Function to get or create a GCP TraceExporter
export async function getGCPTraceExporter() {
  if (gcpTraceExporter) {
    return gcpTraceExporter
  }

  const isGCP = await isRunningInGCP()
  if (isGCP) {
    gcpTraceExporter = new TraceExporter({
      resourceFilter: /^(service\.|g.co\/).*/,
    })
    return gcpTraceExporter
  }

  return null
}

// Function to forward browser telemetry to GCP
export async function forwardBrowserTelemetryToGCP(telemetryData: any) {
  try {
    const isGCP = await isRunningInGCP()
    if (!isGCP) {
      return false
    }

    // The browser telemetry is coming in as OTLP-formatted spans
    // Convert the OTLP spans to Google Cloud Trace format if needed
    // This may require custom processing based on the exact format

    // Ensure we have a GCP trace exporter
    if (!gcpTraceExporter) {
      gcpTraceExporter = new TraceExporter({
        resourceFilter: /^(service\.|g.co\/).*/,
      })
    }

    // Use the exporter directly - it handles auth and conversion
    if (
      telemetryData.resourceSpans &&
      Array.isArray(telemetryData.resourceSpans)
    ) {
      // Process telemetry - this is a simplified approach
      // The actual implementation might need to transform the data structure
      await Promise.all(
        telemetryData.resourceSpans.map(async (resourceSpan: any) => {
          try {
            // The exporter expects span data in a specific format
            // For now we'll just pass it through and see if it works
            await gcpTraceExporter?.export([resourceSpan], () => {
              console.log('Exported browser span to GCP')
            })
          } catch (err) {
            console.error('Error exporting span:', err)
          }
        })
      )

      return true
    }

    return false
  } catch (error) {
    console.error('Error in forwardBrowserTelemetryToGCP:', error)
    return false
  }
}

export async function initServerTracing() {
  // Skip if already initialized or running in a browser environment
  if (isInitialized) {
    return
  }
  if (isInitialized || typeof window !== 'undefined') {
    console.log(
      'OpenTelemetry: SDK already initialized or not in server environment'
    )
    return
  }
  console.log('OpenTelemetry: Initializing server tracing')

  // Set flag early to prevent concurrent initialization attempts
  isInitialized = true

  const isGCP = await isRunningInGCP()
  console.log('OpenTelemetry: Initializing server instrumentation')

  // Try to dynamically import the gRPC instrumentation
  try {
    if (isGCP) {
      // We use dynamic import to ensure this only happens on the server side
      const grpcModule = await import('@opentelemetry/instrumentation-grpc')
      GrpcInstrumentation = grpcModule.GrpcInstrumentation
      console.log('OpenTelemetry: Successfully loaded gRPC instrumentation')
    }
  } catch (error) {
    console.warn(
      'OpenTelemetry: gRPC instrumentation could not be loaded',
      error
    )
    // We'll continue without gRPC instrumentation
  }

  // Configure the OTLP exporter - using HTTP protocol (port 4318) instead of gRPC (port 4317)
  // Then in your initialization code:
  // Choose the appropriate exporter based on environment
  const exporter = isGCP
    ? new TraceExporter({
        resourceFilter: /^(service\.|g.co\/).*/,
      })
    : new OTLPTraceExporter({
        url:
          process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
          'http://localhost:4318/v1/traces',
        headers: {
          // Add any required headers for authentication
        },
      })

  try {
    const [tracingServiceName, tracingServiceVersion] =
      process.env.SERVICE_NAME?.split(':') || ['conciliate-app', 'unknown']
    // Create our custom resource with the service attributes
    const resource = resourceFromAttributes({
      'cloud.platform': 'cloudrun-ignore',
      'cloud.region': isGCP || 'localhost',
      'host.name': process.env.K_SERVICE || 'unknown',
      'host.id': process.env.K_REVISION || 'unknown',
      [ATTR_SERVICE_NAME]: `${tracingServiceName}:${tracingServiceVersion}`,
      [ATTR_SERVICE_VERSION]: tracingServiceVersion,
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      'service.namespace': `${tracingServiceName}:${tracingServiceVersion}`,
      'g.co/agent': 'opentelemetry-js 2.0.0; google-cloud-trace-exporter 2.4.1',
      'g.co/r/generic_node/location': isGCP || 'localhost',
      'g.co/r/generic_node/namespace': `${tracingServiceName}:${tracingServiceVersion}`,
      'g.co/r/generic_node/node_id': process.env.K_SERVICE || 'unknown',
    })

    // Create the instrumentations array
    const instrumentations = [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => {
          // Check if the path starts with '/_next/static'
          const url = request.url || ''
          return (
            url.startsWith('/_next/static') ||
            url.startsWith('/__nextjs-original-stack-frames')
          )
        },
      }),
      new ExpressInstrumentation(),
    ]

    // Add gRPC instrumentation if available
    if (GrpcInstrumentation) {
      instrumentations.push(new GrpcInstrumentation())
      console.log('OpenTelemetry: Added gRPC instrumentation')
    }

    // Create a span processor that adds key attributes before exporting
    const spanProcessor = new BatchSpanProcessor(exporter, {
      // Use a batch span processor for better performance
      maxQueueSize: 1000,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
      maxExportBatchSize: 100,
    })

    // Create a new SDK instance
    sdk = new NodeSDK({
      resource,
      resourceDetectors: [],
      serviceName: `${tracingServiceName}:${tracingServiceVersion}`,
      spanProcessors: [spanProcessor],
      traceExporter: exporter,
      instrumentations,
    })

    // Initialize the SDK
    sdk.start()
    console.log(
      'OpenTelemetry: Server tracing initialized with attributes:',
      resource.attributes
    )

    // Add shutdown hook to clean up resources
    process.on('SIGTERM', () => {
      if (sdk) {
        sdk
          .shutdown()
          .then(() => console.log('OpenTelemetry: Tracing terminated'))
          .catch((error) =>
            console.error('OpenTelemetry: Error terminating tracing', error)
          )
          .finally(() => process.exit(0))
      }
    })
  } catch (error) {
    console.error('OpenTelemetry: Error initializing tracing', error)
    // Reset initialization flag so we can try again later if needed
    isInitialized = false
  }
}
