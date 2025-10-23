#!/bin/bash
set -e

echo "🔍 PromoHive Release Verification"
echo "=================================="

ERRORS=0

# Check .env not committed
echo "📝 Checking .env files..."
if [ -f ".env" ]; then
    echo "❌ .env file found in repository!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No .env file in repository"
fi

# Check build succeeds
echo "🔨 Testing build..."
cd server && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Server build successful"
else
    echo "❌ Server build failed!"
    ERRORS=$((ERRORS + 1))
fi

cd ../client && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Client build successful"
else
    echo "❌ Client build failed!"
    ERRORS=$((ERRORS + 1))
fi

cd ..

# Check for TODOs
echo "📋 Checking for TODOs..."
TODO_COUNT=$(grep -r "TODO" server/src client/src 2>/dev/null | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    echo "⚠️  Found $TODO_COUNT TODO comments (acceptable for initial release)"
fi

# Check for console.log
echo "🔍 Checking for console.log..."
CONSOLE_COUNT=$(grep -r "console.log" server/src 2>/dev/null | wc -l)
if [ $CONSOLE_COUNT -gt 0 ]; then
    echo "⚠️  Found $CONSOLE_COUNT console.log statements"
fi

# Check README exists
echo "📖 Checking README..."
if [ -f "README.md" ]; then
    echo "✅ README.md exists"
else
    echo "❌ README.md missing!"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    exit 0
else
    echo "❌ $ERRORS critical errors found!"
    exit 1
fi

