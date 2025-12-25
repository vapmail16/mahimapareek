#!/bin/bash
# Test database connection with different password encodings

echo "🔍 Testing Remote Database Connection"
echo "====================================="
echo ""

REMOTE_HOST="database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud"
REMOTE_PORT="30523"
REMOTE_USER="TsnZGF"
REMOTE_DB="database-db"

echo "Connection details:"
echo "  Host: $REMOTE_HOST"
echo "  Port: $REMOTE_PORT"
echo "  User: $REMOTE_USER"
echo "  Database: $REMOTE_DB"
echo ""

echo "Testing password variations..."
echo ""

# Test 1: Original password as-is
echo "1. Testing: SQpfn%bjph (original)"
PGPASSWORD="SQpfn%bjph" psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "SELECT version();" 2>&1 | grep -q "PostgreSQL" && echo "   ✅ SUCCESS!" || echo "   ❌ Failed"

# Test 2: URL-encoded %
echo "2. Testing: SQpfn%25bjph (URL-encoded %)"
PGPASSWORD="SQpfn%25bjph" psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "SELECT version();" 2>&1 | grep -q "PostgreSQL" && echo "   ✅ SUCCESS!" || echo "   ❌ Failed"

# Test 3: Without %
echo "3. Testing: SQpfnbjph (without %)"
PGPASSWORD="SQpfnbjph" psql -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$REMOTE_USER" -d "$REMOTE_DB" -c "SELECT version();" 2>&1 | grep -q "PostgreSQL" && echo "   ✅ SUCCESS!" || echo "   ❌ Failed"

echo ""
echo "⚠️  If all tests failed, please verify:"
echo "   1. The password is correct"
echo "   2. The username is correct"
echo "   3. The database credentials from DCDeploy"
