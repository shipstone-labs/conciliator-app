# OpenTelemetry Tracing Implementation

This document explains the OpenTelemetry tracing implementation in the application and how to use the local tracing setup for development.

## Overview

The application uses OpenTelemetry for distributed tracing in both server and browser environments.

### Architecture

1. **Server-side Tracing**: 
   - Uses Next.js instrumentation layer to initialize tracing for all API routes and server components
   - Exports traces to Google Cloud Trace in production, or to local Zipkin/Collector during development

2. **Browser-side Tracing**:
   - Automatically traces page loads, user interactions, and fetch requests
   - Sends traces to our API endpoint which forwards them to the tracing backend
   - Uses the same OpenTelemetry SDK as the server but configured for browser environments
   
3. **Local Development Infrastructure**:
   - **Zipkin** - For visualizing traces
   - **OpenTelemetry Collector** - For collecting and processing traces
   - **Jaeger** - Alternative UI for viewing traces

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and pnpm

### Starting the Tracing Infrastructure

Run the following command to start all tracing services:

```bash
pnpm trace:start
```

This will:
1. Start Zipkin, OpenTelemetry Collector, and Jaeger
2. Wait for services to be ready
3. Display URLs for the UIs

### Running Your App with Tracing

Start your Next.js app with tracing enabled:

```bash
pnpm dev:trace
```

This loads the environment variables from `.env.development` and starts the Next.js development server.

### Viewing Traces

Once your app is running with tracing, you can view traces at:

- **Zipkin UI**: [http://localhost:9411](http://localhost:9411)
- **Jaeger UI**: [http://localhost:16686](http://localhost:16686)

### Stopping the Tracing Infrastructure

When you're done, stop the tracing services:

```bash
pnpm trace:stop
```

## Configuration

### Server-side Tracing

The server-side tracing is implemented in:

- `instrumentation.ts` - Main server tracing initialization using Node SDK
- `lib/tracing.ts` - Helper functions for creating spans and logging
- `lib/apiWithTracing.ts` - Higher-order function to wrap API routes with tracing

### Browser-side Tracing

The browser-side tracing is implemented in:

- `lib/browser-tracing.ts` - Main browser tracing initialization using Web SDK
- `components/TracingProvider.tsx` - React provider for initializing tracing
- `app/client-provider.tsx` - Client provider wrapper for layout
- `hooks/useClientTracing.tsx` - Hook for component and user action tracing
- `app/api/telemetry/route.ts` - API route for forwarding browser traces to collector

### OpenTelemetry Collector

The OpenTelemetry Collector is configured in `otel-collector-config.yaml`. It:

- Receives traces via OTLP (gRPC on port 4317 and HTTP on port 4318)
- Exports to Zipkin and Jaeger
- Provides Prometheus metrics on port 8889

### Environment Variables

Local environment variables for tracing are in `.env.development`:

```
OTEL_SERVICE_NAME=conciliate-app-local
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4317
```

## Instrumenting Your Code

### Tracing API Routes

Wrap your API route handlers with the `withTracing` higher-order function:

```typescript
import { withTracing } from '@/lib/apiWithTracing';

export const POST = withTracing(async (request: NextRequest) => {
  // Your route handler code
  return NextResponse.json({ success: true });
});
```

### Tracing React Components

Use the `useClientTracing` hook to trace component lifecycles and user actions:

```typescript
import { useClientTracing } from '@/hooks/useClientTracing';

function MyComponent() {
  const { traceComponent, traceAction } = useClientTracing();
  
  // Trace component lifecycle
  traceComponent('MyComponent', { propA: 'value' });
  
  // Trace a user action
  const handleClick = () => {
    traceAction('ButtonClick', () => {
      // Action code here
    }, { buttonId: 'submit' });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}
```

### Creating Custom Spans

Create custom spans anywhere in your code:

```typescript
import { withTracing } from '@/lib/tracing';

async function myFunction() {
  return withTracing('MyCustomOperation', async () => {
    // Your code here
    return result;
  }, {
    // Custom attributes
    'operation.type': 'database',
    'operation.name': 'query'
  });
}
```

## Production Setup with Google Cloud Trace

In production, the application is configured to send traces to Google Cloud Trace.

### Prerequisites

1. A Google Cloud project with the Cloud Trace API enabled
2. Appropriate IAM permissions to write to Cloud Trace

### Configuration

The following environment variables should be set in your production environment:

```
# Basic OpenTelemetry configuration
OTEL_SERVICE_NAME=conciliate-app-prod
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_PROTOCOL=grpc

# Google Cloud Trace endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=https://cloudtrace-psc.googleapis.com:443

# Authentication (assuming using default GCP credentials)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Viewing Traces in Google Cloud Console

Traces can be viewed in the Google Cloud Console under the Cloud Trace section. You can:

1. Search traces by service name, span name, or other attributes
2. Filter by time range
3. View detailed span information including attributes and events
4. Analyze performance statistics

## Troubleshooting

### Verifying Services are Running

Check that all services are running:

```bash
docker-compose ps
```

### Checking Collector Logs

If traces aren't showing up in Zipkin or Jaeger:

```bash
docker-compose logs otel-collector
```

### Verifying Browser Trace Export

To check if browser traces are being successfully sent to the backend:

1. Open browser developer tools
2. Go to the Network tab
3. Look for requests to `/api/telemetry` or `localhost:4318` 
4. Check the response status (should be 200)

### Testing the Collector

Send a test span to the collector:

```bash
curl -X POST http://localhost:4318/v1/traces \
  -H 'Content-Type: application/json' \
  -d '{
    "resourceSpans": [
      {
        "resource": {
          "attributes": [
            {
              "key": "service.name",
              "value": { "stringValue": "test-service" }
            }
          ]
        },
        "scopeSpans": [
          {
            "scope": {
              "name": "test-scope"
            },
            "spans": [
              {
                "traceId": "01020304050607080102030405060708",
                "spanId": "0102030405060708",
                "name": "test-span",
                "kind": 1,
                "startTimeUnixNano": "1644641203000000000",
                "endTimeUnixNano": "1644641204000000000"
              }
            ]
          }
        ]
      }
    ]
  }'
```

### Common Issues

1. **No traces appearing in Zipkin/Jaeger**:
   - Check collector logs
   - Verify that the app is running with tracing enabled
   - Ensure endpoints are correctly configured

2. **Browser traces not being collected**:
   - Verify that browser console doesn't show any errors
   - Check Network tab for successful telemetry requests
   - Ensure client-side provider is correctly mounted

3. **Server traces not appearing**:
   - Verify that `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is correct
   - Check that the collector or tracing service is reachable
   - Review server logs for OpenTelemetry initialization messages