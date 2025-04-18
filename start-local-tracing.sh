#!/bin/bash

# First bring down any existing containers
echo "Stopping any existing tracing infrastructure..."
docker-compose down

# Start tracing infrastructure
echo "Starting local tracing infrastructure..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for Zipkin to be ready..."
max_attempts=15
attempt=0
until $(curl --output /dev/null --silent --head --fail http://localhost:9411/health) || [ $attempt -ge $max_attempts ]; do
    printf '.'
    attempt=$((attempt+1))
    sleep 2
done

if [ $attempt -ge $max_attempts ]; then
    echo "Zipkin service did not become ready in time. Check docker logs with: docker-compose logs zipkin-all-in-one"
fi

echo "Waiting for OTEL Collector to be ready..."
attempt=0
until $(curl --output /dev/null --silent --head --fail http://localhost:9464/) || [ $attempt -ge $max_attempts ]; do
    printf '.'
    attempt=$((attempt+1))
    sleep 2
done

if [ $attempt -ge $max_attempts ]; then
    echo "OTEL Collector service did not become ready in time. Check docker logs with: docker-compose logs tracing-collector"
fi

echo ""
echo "Tracing infrastructure is ready!"
echo ""
echo "Zipkin UI:    http://localhost:9411"
echo "Jaeger UI:    http://localhost:16686"
echo ""
echo "To stop the tracing infrastructure:"
echo "  docker-compose down"
echo ""
echo "To start your Next.js app with tracing enabled:"
echo "  pnpm dev:trace"
echo ""
echo "Enjoy debugging with OpenTelemetry!"