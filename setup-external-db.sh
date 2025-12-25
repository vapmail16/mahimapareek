#!/bin/bash
# External Database Setup Script
# This script helps set up the external PostgreSQL database

set -e

echo "🚀 External Database Setup for Mahimapareek"
echo "=========================================="
echo ""

cd backend

# Step 1: Update .env file
echo "📝 Step 1: Updating DATABASE_URL in .env..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
fi

# Backup existing .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update DATABASE_URL (you may need to adjust the password encoding)
# Note: External database is 'database-db', local is 'mahimapareek_db' - this is fine
EXTERNAL_DB_URL="postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db"

echo "⚠️  Note: External database name is 'database-db' (local uses 'mahimapareek_db')"
echo "   This is fine - Prisma works with any database name."
echo ""

# Use sed to update DATABASE_URL (works on macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$EXTERNAL_DB_URL|" .env
else
    # Linux
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$EXTERNAL_DB_URL|" .env
fi

echo "✅ DATABASE_URL updated in .env"
echo ""

# Step 2: Test connection
echo "🔌 Step 2: Testing database connection..."
if npx prisma db pull --force 2>&1 | grep -q "Introspecting"; then
    echo "✅ Database connection successful!"
else
    echo "❌ Connection failed. Please check:"
    echo "   1. Database URL is correct"
    echo "   2. Password encoding (try %25 instead of %)"
    echo "   3. Network connectivity"
    echo ""
    echo "Trying alternative password encoding..."
    # Try with %25 encoding
    EXTERNAL_DB_URL_ALT="postgresql://TsnZGF:SQpfn%25bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$EXTERNAL_DB_URL_ALT|" .env
    else
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$EXTERNAL_DB_URL_ALT|" .env
    fi
    echo "Updated to use %25 encoding. Please test again manually."
    exit 1
fi
echo ""

# Step 3: Generate Prisma Client
echo "🔧 Step 3: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 4: Check migration status
echo "📊 Step 4: Checking migration status..."
npx prisma migrate status
echo ""

# Step 5: Apply migrations
echo "🚀 Step 5: Applying database migrations..."
read -p "This will create all tables in the external database. Continue? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo "✅ Migrations applied successfully!"
else
    echo "⏭️  Skipped. Run 'npx prisma migrate deploy' manually when ready."
fi
echo ""

# Step 5: Verify schema
echo "✅ Step 6: Verifying database schema..."
echo "Opening Prisma Studio to view tables..."
echo "Press Ctrl+C to exit Prisma Studio when done."
echo ""
read -p "Open Prisma Studio now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma studio
else
    echo "⏭️  Skipped. Run 'npx prisma studio' manually to verify."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Test the application: npm run dev"
echo "2. Check health endpoint: curl http://localhost:3000/health"
echo "3. Review DATABASE_SETUP.md for troubleshooting"
