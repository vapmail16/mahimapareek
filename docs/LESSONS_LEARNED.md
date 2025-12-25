# Lessons Learned - Sahadeva Jyotish SaaS

**Purpose**: Document key learnings to prevent repeating issues in future development.

**Last Updated**: December 16, 2025

---

## 🎓 Key Lessons from Week 3 Day 1

### 1. Always Check Existing Code Before Importing ⭐⭐⭐

**What Went Wrong**: Made 3 import errors by assuming file names/paths
- Assumed `appError.ts` → Actually `errors.ts`
- Assumed `audit.service.ts` → Actually `auditService.ts`
- Assumed API parameters without checking

**Prevention**:
```bash
# ALWAYS do this before importing:
find backend/src -name "*error*"
ls backend/src/services/
grep -r "export class AppError" backend/src
```

**Rule**: **Never assume file names or API signatures. Always verify first.**

---

### 2. Read Function Signatures Before Calling APIs ⭐⭐⭐

**What Went Wrong**: Used wrong parameter names in `createAuditLog()`:
- Used `resourceType` → Should be `resource`
- Used `status` → Should be in `details` object
- Used `errorMessage` → Should be in `details` object

**Prevention**:
1. Read the actual function signature
2. Use TypeScript autocomplete
3. Check existing usage in codebase
4. Run type checker before testing

**Rule**: **Read the code, don't guess the API.**

---

### 3. Use Repository Methods in Test Fixtures ⭐⭐⭐

**What Went Wrong**: Direct Prisma calls in test setup caused FK constraint violations

```typescript
// ❌ BAD: Direct Prisma in tests
beforeEach(async () => {
  await prisma.profile.create({ data: validProfileData });
});

// ✅ GOOD: Use repository methods
beforeEach(async () => {
  await repository.create(validProfileData);
});
```

**Why This Matters**:
- Repository uses same Prisma client instance
- Maintains proper transaction scope
- Tests actual behavior (better TDD)
- Avoids FK constraint timing issues

**Rule**: **Use repository/service methods in test setup, never direct Prisma.**

---

### 4. Create Reusable Test Fixtures Early ⭐⭐

**What Went Wrong**: Wasted 45 minutes debugging test environment issues

**Solution Created**:
- `test/fixtures/user.fixtures.ts` - Reusable test users & auth
- `test/fixtures/profile.fixtures.ts` - Reusable profile data
- `test/helpers/api.helpers.ts` - API request helpers
- `test/helpers/database.helpers.ts` - DB utilities

**Rule**: **Create fixtures BEFORE writing tests, not after encountering issues.**

---

### 5. Check for Running Processes Before Starting Server ⭐⭐

**What Went Wrong**: Multiple `tsx watch` processes caused port conflicts

**Prevention**:
```bash
# Check before starting
ps aux | grep "tsx watch" | grep -v grep

# Clean start
pkill -f "tsx watch" && npm run dev
```

**Rule**: **Always check for zombie processes before starting servers.**

---

### 6. Document Naming Conventions ⭐

**What Went Wrong**: Inconsistent naming caused confusion
- Some files: `service.name.ts`
- Some files: `serviceName.ts`

**Rule**: **Pick ONE naming convention and document it in README.**

---

### 7. Verify API Response Structure Before Scripting ⭐

**What Went Wrong**: Tried to extract `.data.token` but field is `.data.accessToken`

**Prevention**:
```bash
# Test the API first
curl -s http://localhost:3001/api/auth/login -d '...' | jq '.'

# Then extract the field
jq -r '.data.accessToken'
```

**Rule**: **Test API responses manually before writing scripts.**

---

### 8. Check Server Logs for Actual Port Number ⭐

**What Went Wrong**: Expected port 3000, server running on 3001

**Prevention**:
```bash
# Check logs
tail -f /tmp/backend.log

# Or use environment variable
PORT=${PORT:-3001}
```

**Rule**: **Don't assume ports. Check logs or use env vars.**

---

## 📋 Development Checklist

Use this checklist for every new feature:

### Before Writing Code
- [ ] Check existing code structure
- [ ] Verify file naming conventions
- [ ] Read API signatures of functions you'll call
- [ ] Create test fixtures if needed
- [ ] Check for running processes

### While Writing Code
- [ ] Use TypeScript autocomplete for imports
- [ ] Run linter/type checker frequently
- [ ] Test incrementally (don't write everything at once)
- [ ] Use repository methods in tests, not direct Prisma

### After Writing Code
- [ ] Run linter: `npm run lint`
- [ ] Run type checker: `tsc --noEmit`
- [ ] Test server startup
- [ ] Run tests
- [ ] Check logs for errors
- [ ] Document any issues encountered

---

## 🎯 Quick Reference Commands

### Check Existing Code
```bash
# Find files
find backend/src -name "*pattern*"

# List directory
ls backend/src/services/

# Search for exports
grep -r "export class ClassName" backend/src

# Check existing usage
grep -A 10 "functionName" backend/src/**/*.ts
```

### Process Management
```bash
# Check running processes
ps aux | grep "tsx watch"

# Kill processes
pkill -f "tsx watch"

# Kill by port
lsof -ti:3001 | xargs kill -9
```

### Testing
```bash
# Run specific test
npm test -- filename.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### API Testing
```bash
# Test endpoint
curl -s http://localhost:3001/api/health | jq '.'

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}' \
  | jq -r '.data.accessToken')

# Use token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/profiles
```

---

## 💡 Best Practices Summary

### Code Organization
1. ✅ Follow layered architecture (routes → services → repositories)
2. ✅ Keep layers independent and testable
3. ✅ Use dependency injection
4. ✅ Consistent naming conventions

### Security
1. ✅ Always use Prisma ORM (parameterized queries)
2. ✅ Extract userId from JWT token, NEVER from request body
3. ✅ Validate all inputs in service layer
4. ✅ Mask PII in logs
5. ✅ Audit log all CRUD operations

### Testing
1. ✅ Create fixtures before writing tests
2. ✅ Use repository methods in test setup
3. ✅ Clean up test data in afterAll/afterEach
4. ✅ Use consistent test user IDs
5. ✅ Test both success and error cases

### Development Workflow
1. ✅ Check existing code before creating new files
2. ✅ Read function signatures before calling APIs
3. ✅ Run linter frequently
4. ✅ Test incrementally
5. ✅ Document issues immediately

---

## 📊 Issue Statistics

### Week 3 Day 1
- **Total Issues**: 8
- **Time Lost**: ~85 minutes
- **Prevention Rate**: 100% (all have prevention strategies)

### Issue Categories
- Import/Path Issues: 37.5%
- API/Interface Mismatches: 25%
- Test Environment: 12.5%
- Process Management: 12.5%
- Configuration: 12.5%

### Severity Breakdown
- High (Server crash): 4 issues
- Medium: 2 issues
- Low: 2 issues

---

## 🚀 Moving Forward

### For Next Features
1. Use test fixtures from day 1
2. Follow the development checklist
3. Check existing code patterns first
4. Document new issues immediately
5. Update this document with new learnings

### Success Metrics
- Fewer import/path errors
- Faster development (less debugging)
- More consistent code quality
- Better test coverage
- Clearer documentation

---

## 📚 Related Documents

- **Issue Log**: `ISSUE_LOG.md` - Detailed issue tracking
- **Test Fixtures**: `backend/src/test/README.md` - How to use fixtures
- **Week 3 Complete**: `WEEK_3_DAY1_COMPLETE.md` - Full day 1 report
- **Master Checklist**: `MASTER_CHECKLIST.md` - Development standards
- **Master Guidelines**: `MASTER_GUIDELINES.md` - Best practices

---

**Remember**: Every issue is a learning opportunity. Document it, create prevention strategies, and move forward smarter! 🎯

---

*Last Updated: December 16, 2025*

