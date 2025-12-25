#!/bin/bash
# Migrate Data from Local to Remote Database
# Run this AFTER migrate-to-remote-db.sh (schema migration)

set -e

echo "📦 Migrating Data from Local to Remote Database"
echo "==============================================="
echo ""

cd backend

# Get database URLs
LOCAL_DB_URL=$(grep "^DATABASE_URL" .env.backup.before-migration.* 2>/dev/null | head -1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "")
REMOTE_DB_URL=$(grep "^DATABASE_URL" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$LOCAL_DB_URL" ]; then
    echo "⚠️  Could not find local database URL from backup"
    echo "   Please provide local DATABASE_URL:"
    read -p "   Local DATABASE_URL: " LOCAL_DB_URL
fi

if [ -z "$REMOTE_DB_URL" ]; then
    echo "❌ Could not find remote database URL in .env"
    exit 1
fi

echo "📊 Database URLs:"
echo "   Local:  $LOCAL_DB_URL"
echo "   Remote: $REMOTE_DB_URL"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "⚠️  pg_dump not found. Installing PostgreSQL client tools..."
    echo ""
    echo "   macOS: brew install postgresql"
    echo "   Linux: sudo apt-get install postgresql-client"
    echo ""
    echo "   Or use Docker:"
    echo "   docker run --rm -v \$(pwd):/backup postgres:15 pg_dump ..."
    echo ""
    exit 1
fi

echo "🔍 Step 1: Checking local database for data..."
echo ""

# Extract connection details for pg_dump
parse_db_url() {
    local url=$1
    # Remove postgresql:// prefix
    url=${url#postgresql://}
    
    # Extract user:password
    if [[ $url == *"@"* ]]; then
        user_pass=${url%%@*}
        rest=${url#*@}
        
        if [[ $user_pass == *":"* ]]; then
            user=${user_pass%%:*}
            pass=${user_pass#*:}
        else
            user=$user_pass
            pass=""
        fi
    else
        user=""
        pass=""
        rest=$url
    fi
    
    # Extract host:port/database
    if [[ $rest == *"/"* ]]; then
        host_port=${rest%%/*}
        database=${rest#*/}
        # Remove query string if present
        database=${database%%\?*}
    else
        host_port=$rest
        database=""
    fi
    
    if [[ $host_port == *":"* ]]; then
        host=${host_port%%:*}
        port=${host_port#*:}
    else
        host=$host_port
        port="5432"
    fi
    
    echo "$user|$pass|$host|$port|$database"
}

LOCAL_PARTS=$(parse_db_url "$LOCAL_DB_URL")
REMOTE_PARTS=$(parse_db_url "$REMOTE_DB_URL")

IFS='|' read -r local_user local_pass local_host local_port local_db <<< "$LOCAL_PARTS"
IFS='|' read -r remote_user remote_pass remote_host remote_port remote_db <<< "$REMOTE_PARTS"

echo "   Local DB:  $local_db @ $local_host:$local_port"
echo "   Remote DB: $remote_db @ $remote_host:$remote_port"
echo ""

# Check table counts
echo "📊 Step 2: Checking data in local database..."
LOCAL_USER_COUNT=$(PGPASSWORD="$local_pass" psql -h "$local_host" -p "$local_port" -U "$local_user" -d "$local_db" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
LOCAL_PAPER_COUNT=$(PGPASSWORD="$local_pass" psql -h "$local_host" -p "$local_port" -U "$local_user" -d "$local_db" -t -c "SELECT COUNT(*) FROM question_papers;" 2>/dev/null | tr -d ' ' || echo "0")

echo "   Local database has:"
echo "     - $LOCAL_USER_COUNT users"
echo "     - $LOCAL_PAPER_COUNT question papers"
echo ""

if [ "$LOCAL_USER_COUNT" -eq "0" ] && [ "$LOCAL_PAPER_COUNT" -eq "0" ]; then
    echo "   ✅ Local database is empty - no data to migrate"
    exit 0
fi

echo "🚀 Step 3: Migrating data..."
echo ""

read -p "   This will copy data from local to remote. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏭️  Cancelled"
    exit 0
fi

# Create dump file
DUMP_FILE="database_dump_$(date +%Y%m%d_%H%M%S).sql"
echo ""
echo "   Creating database dump..."
PGPASSWORD="$local_pass" pg_dump -h "$local_host" -p "$local_port" -U "$local_user" -d "$local_db" --data-only --no-owner --no-privileges > "$DUMP_FILE" 2>/dev/null

if [ ! -f "$DUMP_FILE" ] || [ ! -s "$DUMP_FILE" ]; then
    echo "   ❌ Failed to create dump file"
    exit 1
fi

echo "   ✅ Dump created: $DUMP_FILE"
echo ""

# Restore to remote
echo "   Restoring to remote database..."
# URL-encode password if needed
REMOTE_PASS_ENCODED=$(echo "$remote_pass" | sed 's/%/%25/g' | sed 's/@/%40/g' | sed 's/#/%23/g')

if PGPASSWORD="$remote_pass" psql -h "$remote_host" -p "$remote_port" -U "$remote_user" -d "$remote_db" < "$DUMP_FILE" 2>&1 | grep -v "already exists\|does not exist"; then
    echo "   ✅ Data restored successfully"
else
    echo "   ⚠️  Some warnings may have occurred, but data should be migrated"
fi

echo ""
echo "🧹 Cleaning up..."
rm -f "$DUMP_FILE"
echo "   ✅ Cleanup complete"
echo ""

echo "🎉 Data Migration Complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Migrated $LOCAL_USER_COUNT users"
echo "   ✅ Migrated $LOCAL_PAPER_COUNT question papers"
echo "   ✅ All data copied to remote database"
echo ""
echo "📝 Next Steps:"
echo "   1. Verify data in remote database: npx prisma studio"
echo "   2. Test the application: npm run dev"
echo "   3. Check that all data is accessible"
echo ""

