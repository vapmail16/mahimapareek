#!/bin/bash
# Quick script to update DATABASE_URL in backend/.env

set -e

cd backend

if [ ! -f .env ]; then
    echo "❌ .env file not found in backend/"
    exit 1
fi

echo "📝 Current DATABASE_URL:"
grep "^DATABASE_URL" .env

echo ""
echo "🔄 Updating to external database..."
echo "   External DB: database-db (current local: mahimapareek_db)"
echo ""

# Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up to .env.backup.*"

# Update (macOS compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db|' .env
else
    sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db|' .env
fi

echo ""
echo "✅ Updated DATABASE_URL:"
grep "^DATABASE_URL" .env

echo ""
echo "⚠️  If connection fails, try encoding '%' as '%25' in the password"
echo "   Edit .env manually and change SQpfn%bjph to SQpfn%25bjph"
