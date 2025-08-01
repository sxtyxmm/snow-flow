#!/bin/bash

echo "🚀 Running integration tests against REAL ServiceNow instance..."
echo "Instance: ${SNOW_INSTANCE:-Not set}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Copying from .env.example..."
    cp .env.example .env
fi

# Source environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$SNOW_INSTANCE" ] || [ -z "$SNOW_CLIENT_ID" ] || [ -z "$SNOW_CLIENT_SECRET" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure SNOW_INSTANCE, SNOW_CLIENT_ID, and SNOW_CLIENT_SECRET are set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Run the integration tests
echo "🧪 Starting tests..."
npm test -- tests/integration/advanced-features-real.test.ts --forceExit --detectOpenHandles

echo ""
echo "✨ Tests completed!"