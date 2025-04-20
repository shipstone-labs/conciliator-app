# OpenTelemetry Setup for Conciliate App

This document explains how OpenTelemetry is set up in this Next.js application for tracing with Google Cloud Trace.

## Overview

OpenTelemetry is implemented to provide distributed tracing for the application. The setup includes:

1. Server-side instrumentation via Next.js instrumentation hook
2. API route tracing with middleware
3. Custom logging that integrates with trace spans
4. Google Cloud Trace integration
5. Client-side browser tracing with React integration
6. End-to-end tracing from browser to server

## Files

- `instrumentation.ts` - Main OpenTelemetry setup file (loaded by Next.js)
- `lib/tracing.ts` - Helper utilities for server-side tracing and logging
- `lib/apiWithTracing.ts` - Middleware for API routes
- `lib/browser-tracing.ts` - Client-side tracing implementation
- `hooks/useClientTracing.tsx` - React hook for component tracing
- `components/TracingProvider.tsx` - Provider component for browser tracing
- `app/api/telemetry/route.ts` - Endpoint to collect browser telemetry

## Environment Variables

The following environment variables are set in the Dockerfile:

```
OTEL_SERVICE_NAME="conciliate-app"
OTEL_TRACES_EXPORTER="otlp"
OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
OTEL_NODE_RESOURCE_DETECTORS="gcp"
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://localhost:4317"
```

## Required Dependencies

Install these dependencies to enable OpenTelemetry:

```bash
# Server-side tracing
pnpm add @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-proto \
         @opentelemetry/resources @opentelemetry/semantic-conventions \
         @opentelemetry/sdk-trace-node @opentelemetry/instrumentation \
         @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express \
         @opentelemetry/instrumentation-grpc

# Client-side tracing
pnpm add @opentelemetry/sdk-trace-web @opentelemetry/sdk-trace-base \
        @opentelemetry/core @opentelemetry/context-zone \
        @opentelemetry/instrumentation-fetch @opentelemetry/exporter-trace-otlp-http \
        @opentelemetry/instrumentation-user-interaction @opentelemetry/instrumentation-document-load
```

## Usage

### Tracing API Routes

Wrap your API route handlers with the tracing middleware:

```typescript
import { withTracing } from '@/lib/apiWithTracing';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withTracing(async (request: NextRequest) => {
  // Your API handler code
  return NextResponse.json({ success: true });
});
```

### Tracing React Components

Use the client tracing hook in your React components:

```typescript
'use client';

import { useClientTracing } from '@/hooks/useClientTracing';

export function MyComponent({ someProps }) {
  const { traceComponent, traceAction } = useClientTracing();
  
  // Track component lifecycle
  traceComponent('MyComponent', { props: JSON.stringify(someProps) });
  
  // Track user interactions
  const handleClick = () => {
    traceAction('Button Click', async () => {
      // Your action code here
      await fetchSomeData();
    });
  };
  
  return (
    <button onClick={handleClick}>Click Me</button>
  );
}
```

### Custom Tracing

Use the `withTracing` helper for custom operations:

```typescript
import { withTracing } from '@/lib/tracing';

async function someOperation() {
  return withTracing('operation-name', async () => {
    // Operation code here
    return result;
  }, { 
    // Optional attributes
    'attribute.key': 'value' 
  });
}
```

### Logging

Use the enhanced logger to add logs to the current trace span:

```typescript
import { logger } from '@/lib/tracing';

logger.info('Something happened', { additionalData: 'value' });
logger.error('An error occurred', error);
```

## Viewing Traces

Traces can be viewed in Google Cloud Console under Cloud Trace.

## IAM Permissions

The service account needs the following role:
- `roles/cloudtrace.agent`

This is configured in the deployment script.