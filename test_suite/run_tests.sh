#!/bin/bash
set -e

echo "Starting Rumble OS End-to-End Tests..."
cd ../dashboard

# Ensure dependencies are installed
npm install

# Run the Playwright test suite
# The playwright.config.ts is configured to automatically boot the Next.js server on port 3000
npx playwright test

echo "Tests completed successfully!"
