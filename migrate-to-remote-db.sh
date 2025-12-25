#!/bin/bash
# Script to migrate local database to remote database
# Based on Sahadeva project approach
# Usage: ./migrate-to-remote-db.sh

set -e  # Exit on error

echo "=========================================="
echo "Database Migration to Remote"
echo "=========================================="
echo ""

cd backend

# Remote database connection string (exactly as provided)
REMOTE_DB_URL="postgresql://bzxwjr:LL1{GG4Q)z@databasenew-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30361/databasenew-db"

# Step 1: Test connection to remote database
echo "Step 1: Testing connection to remote database..."
export DATABASE_URL="$REMOTE_DB_URL"
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Remote database connection successful"
else
    echo "⚠️  Direct test failed, trying Prisma migrate deploy..."
    # Try migration directly (like Sahadeva did)
    echo "   Attempting migration (this will create tables if database is accessible)..."
fi

# Step 2: Create backup of current .env if it exists
if [ -f .env ]; then
    echo ""
    echo "Step 2: Backing up current .env file..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
else
    echo ""
    echo "Step 2: No existing .env file found"
fi

# Step 3: Run migrations on remote database
echo ""
echo "Step 3: Running migrations on remote database..."
export DATABASE_URL="$REMOTE_DB_URL"
npx prisma migrate deploy
echo "✅ Migrations completed"

# Step 4: Generate Prisma client with new connection
echo ""
echo "Step 4: Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Step 5: Update .env file
echo ""
echo "Step 5: Updating .env file with remote database URL..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "# Database" > .env
    echo "DATABASE_URL=\"$REMOTE_DB_URL\"" >> .env
    echo "" >> .env
    echo "# Other required variables" >> .env
    echo "# JWT_SECRET=your-secret-key-minimum-32-characters-long" >> .env
    echo "# JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long" >> .env
    echo "✅ Created new .env file"
else
    # Update existing .env file (with quotes like Sahadeva)
    if grep -q "^DATABASE_URL=" .env; then
        # Replace existing DATABASE_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$REMOTE_DB_URL\"|" .env
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$REMOTE_DB_URL\"|" .env
        fi
    else
        # Add DATABASE_URL if it doesn't exist
        echo "DATABASE_URL=\"$REMOTE_DB_URL\"" >> .env
    fi
    echo "✅ Updated .env file"
fi

# Step 6: Verify connection
echo ""
echo "Step 6: Verifying connection..."
export DATABASE_URL="$REMOTE_DB_URL"
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"_prisma_migrations\";" > /dev/null 2>&1; then
    echo "✅ Connection verified - can query remote database"
else
    echo "⚠️  Connection test had issues, but migration completed"
fi

echo ""
echo "=========================================="
echo "✅ Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Your .env file now points to the remote database"
echo "2. Test your application: npm run dev"
echo "3. Check data: npx prisma studio"
echo ""
echo "Note: Your old .env backup is saved as .env.backup.*"
echo ""
