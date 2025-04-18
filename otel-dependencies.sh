#!/bin/bash

# Install OpenTelemetry packages for server-side
pnpm add -w @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-proto \
         @opentelemetry/resources @opentelemetry/semantic-conventions \
         @opentelemetry/sdk-trace-node @opentelemetry/instrumentation \
         @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express \
         @opentelemetry/instrumentation-grpc

# Install OpenTelemetry packages for browser/client-side
pnpm add -w @opentelemetry/sdk-trace-web @opentelemetry/sdk-trace-base \
        @opentelemetry/core @opentelemetry/context-zone \
        @opentelemetry/instrumentation-fetch @opentelemetry/exporter-trace-otlp-http \
        @opentelemetry/instrumentation-user-interaction @opentelemetry/instrumentation-document-load