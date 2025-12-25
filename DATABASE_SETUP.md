# External Database Setup Guide

**Date**: December 18, 2025  
**Database**: PostgreSQL (DCDeploy Cloud)  
**Status**: Setup Instructions

---

## Database Connection Details

**Connection String**:
```
postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db
```

**Connection Details**:
- **Host**: `database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud`
- **Port**: `30523`
- **Database**: `database-db` ⚠️ **Note**: External database name is `database-db` (not `mahimapareek_db`)
- **Username**: `TsnZGF`
- **Password**: `SQpfn%bjph` (note: `%` is part of the password, not URL encoding)

**Important**: The external database is named `database-db`, while the local database is `mahimapareek_db`. This is fine - Prisma will work with any database name. The application doesn't require a specific database name.

---

## Migration Process (Recommended)

**For migrating from local to remote database**, use the automated script:

```bash
./migrate-to-remote-db.sh
```

This script will:
1. ✅ Test remote database connection
2. ✅ Apply all migrations to remote database
3. ✅ Generate Prisma Client
4. ✅ Update `.env` to point to remote database
5. ✅ Test connection with new configuration

**For data migration** (if local database has data):
```bash
./migrate-data.sh
```

---

## Step-by-Step Setup Instructions (Manual)

### Step 1: Update Local Environment File

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Check current `.env` file**:
```bash
# View current DATABASE_URL
grep "^DATABASE_URL" .env
```

**Current local database**: `mahimapareek_db`  
**External database**: `database-db` (this is correct - use this for external connection)

3. **Update `DATABASE_URL` in `.env`**:
```bash
# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update DATABASE_URL (replace the entire line)
# On macOS:
sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db|' .env

# Or manually edit .env and change:
# FROM: DATABASE_URL=postgresql://user@localhost:5432/mahimapareek_db
# TO:   DATABASE_URL=postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db
```

**Important Notes**:
- ⚠️ **Database name change**: External uses `database-db`, local uses `mahimapareek_db` - this is fine
- The password contains `%` which is a special character in URLs
- If connection fails, try URL-encoding the `%` as `%25`: `SQpfn%25bjph`
- Alternatively, if the password should be `SQpfnbjph` (without %), use that

### Step 2: Test Database Connection

1. **Install PostgreSQL client** (if not already installed):
```bash
# macOS
brew install postgresql

# Or use Docker
docker run -it --rm postgres:15 psql "postgresql://TsnZGF:SQpfn%bjph@database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523/database-db"
```

2. **Test connection using Prisma**:
```bash
cd backend
npx prisma db pull
```

If this succeeds, the connection is working.

3. **Alternative: Test with Node.js**:
```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(e => { console.error('❌ Error:', e.message); process.exit(1); });"
```

### Step 3: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This generates the Prisma Client with the correct database schema.

### Step 4: Run Database Migrations

**IMPORTANT**: This will create all tables in the external database. Make sure you have the correct database selected.

1. **Check current migration status**:
```bash
npx prisma migrate status
```

2. **Deploy migrations to external database**:
```bash
npx prisma migrate deploy
```

This will:
- Apply all pending migrations
- Create all tables, indexes, and constraints
- Set up the complete database schema

**Expected Output**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "database-db", schema "public" at "database-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30523"

1 migration found in prisma/migrations

Applying migration `20251218184206_init`
Migration `20251218184206_init` applied successfully.
```

### Step 5: Verify Database Schema

1. **Open Prisma Studio** (optional, for visual verification):
```bash
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can view all tables.

2. **Or verify using SQL**:
```bash
npx prisma db execute --stdin << EOF
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF
```

**Expected Tables**:
- `users`
- `sessions`
- `password_resets`
- `audit_logs`
- `notifications`
- `notification_preferences`
- `payments`
- `payment_refunds`
- `payment_webhook_logs`
- `subscriptions`
- `data_export_requests`
- `data_deletion_requests`
- `consent_records`
- `categories`
- `posts`
- `question_papers`
- `questions`
- `answer_papers`
- `answer_files`
- `question_answers`
- `ai_grading_results`
- `manual_reviews`

### Step 6: Test Application Connection

1. **Start the backend server**:
```bash
cd backend
npm run dev
```

2. **Check health endpoint**:
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

3. **Check logs** for database connection:
Look for messages like:
```
✅ Database connected successfully
```

### Step 7: Create Initial Test Data (Optional)

If you want to test with sample data:

```bash
# Using Prisma Studio (recommended)
npx prisma studio

# Or create a seed script (if configured)
npx prisma db seed
```

---

## Troubleshooting

### Issue 1: Connection Timeout

**Symptom**: 
```
Error: P1001: Can't reach database server
```

**Solutions**:
1. Check if the database host is accessible from your network
2. Verify firewall rules allow connections from your IP
3. Check if the port `30523` is correct
4. Try using a VPN if the database is behind a firewall

### Issue 2: Authentication Failed

**Symptom**:
```
Error: P1000: Authentication failed
```

**Solutions**:
1. Verify username and password are correct
2. Try URL-encoding special characters in password:
   - `%` → `%25`
   - `@` → `%40`
   - `#` → `%23`
3. Check if the user has proper permissions

### Issue 3: Database Does Not Exist

**Symptom**:
```
Error: P1003: Database `database-db` does not exist
```

**Solutions**:
1. Verify the database name is correct
2. Contact DCDeploy support to create the database
3. Or connect to a different database that exists

### Issue 4: Migration Fails

**Symptom**:
```
Error: Migration failed
```

**Solutions**:
1. Check if tables already exist (might have been partially applied)
2. Use `npx prisma migrate resolve --rolled-back <migration-name>` if needed
3. Check database logs for specific error messages
4. Ensure user has CREATE TABLE permissions

### Issue 5: SSL/TLS Connection Required

**Symptom**:
```
Error: SSL connection required
```

**Solutions**:
1. Add `?sslmode=require` to DATABASE_URL:
   ```
   DATABASE_URL=postgresql://...?sslmode=require
   ```
2. Or use `?sslmode=prefer` for optional SSL

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Database connection tested and working
- [ ] All migrations applied successfully
- [ ] Database schema verified (all tables exist)
- [ ] Connection string stored securely (not in code)
- [ ] Database backups configured
- [ ] Connection pooling tested
- [ ] SSL/TLS enabled (if required)
- [ ] Database user has minimal required permissions
- [ ] Firewall rules configured
- [ ] Monitoring/alerting set up

---

## Next Steps

After database setup is complete:

1. **Update Production Environment Variables**:
   - Set `DATABASE_URL` in DCDeploy backend service
   - Ensure all other required env vars are set

2. **Deploy Backend**:
   - Build Docker image
   - Deploy to DCDeploy
   - Verify health endpoint

3. **Deploy Frontend**:
   - Build with production API URL
   - Deploy to DCDeploy
   - Test end-to-end

4. **Run Integration Tests**:
   - Test user registration
   - Test question paper creation
   - Test answer paper submission
   - Test grading workflow

---

## Quick Reference Commands

```bash
# Test connection
npx prisma db pull

# Generate Prisma Client
npx prisma generate

# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Open database browser
npx prisma studio

# Reset database (⚠️ DESTRUCTIVE - deletes all data)
npx prisma migrate reset
```

---

**Last Updated**: December 18, 2025  
**Prepared For**: External Database Setup

