#!/bin/bash
set -e

echo "🧪 Running PromoHive Tests"
echo "=========================="

cd server

echo "📦 Installing dependencies..."
npm install

echo "🧪 Running tests with coverage..."
npm run test:coverage

echo ""
echo "✅ All tests completed!"
echo "📊 Check coverage report in server/coverage/"

