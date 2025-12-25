# Master Guidelines - Complete Development & Production Best Practices

This document consolidates all guidelines, best practices, principles, patterns, and recommendations from all standards documents into a single comprehensive guide.

**Last Updated**: Based on all guideline documents as of the consolidation date

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Project Setup & Foundation](#project-setup--foundation)
3. [Security](#security)
4. [Code Quality](#code-quality)
5. [Database](#database)
6. [Testing](#testing)
7. [Logging & Monitoring](#logging--monitoring)
8. [Deployment & CI/CD](#deployment--cicd)
9. [Operations & Incident Response](#operations--incident-response)
10. [Compliance & Regulatory](#compliance--regulatory)
11. [Data Protection & PII](#data-protection--pii)
12. [Production Readiness](#production-readiness)

---

## Core Principles

### Fundamental Principle

**Building correctly from the start takes 20% more time initially but saves 70% of time overall.**

### Security-First Principle

**Security is not a feature you add later—it's a fundamental aspect of how you build software.** Every line of code, every API endpoint, and every user interaction must be designed with security in mind from the beginning.

**Key Insight**: Adding security after building features takes 3-4x longer than building securely from the start.

### Code Quality Principle

**Code is read far more than it's written.** Write code for the person who will read it next—which might be you in six months.

### Database Principle

**Database changes are expensive and risky.** Unlike application code that can be refactored relatively easily, database changes are often irreversible and can cause downtime. Getting database design right from the start prevents costly migrations and data loss.

### Operations Principle

**Operations is not optional.** The best application in the world is useless if it's down, slow, or insecure. Invest in operational excellence from the start.

### TDD Principle

**Write tests before writing implementation code.** The RED → GREEN → REFACTOR cycle ensures confidence in code changes, living documentation, better code design, and regression prevention.

### Testing Principle

**Testing the algorithm ≠ Testing the feature.** For UI features, you must test the actual user experience, not just the underlying logic.

---

## Project Setup & Foundation

### Project Structure Guidelines

**Recommended Structure**:
```
project-root/
├── backend/              # Backend application
│   ├── config/          # Configuration files
│   ├── middleware/       # Express/HTTP middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic layer
│   ├── repositories/    # Data access layer
│   ├── utils/           # Utility functions
│   ├── tests/           # Test files
│   └── server.js        # Application entry point
├── frontend/            # Frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   ├── contexts/    # Global state management
│   │   └── utils/       # Frontend utilities
│   └── public/          # Static assets
├── database/            # Database scripts
│   ├── schema.sql       # Database schema
│   ├── migrations/      # Migration scripts
│   └── seeds/           # Seed data
├── docs/                # Documentation
├── scripts/             # Utility scripts
├── .gitignore          # Git ignore rules
└── README.md            # Project documentation
```

**Structure Principles**:
- **Separation of Frontend and Backend**: Even if building a monolith initially, separate frontend and backend code to deploy independently, scale components separately, test in isolation, and add new team members to specific areas
- **Layered Architecture in Backend**: The `routes → services → repositories` pattern provides clear separation of concerns where routes handle HTTP only, services contain business logic, and repositories handle data access
- **Database Folder**: Keep database scripts separate to ensure schema is version-controlled, migrations are documented, and database changes are tracked

### Technology Stack Decision Guidelines

**Database Selection**:
- **Use SQLite for**: Single-user applications, local development tools, embedded systems, prototyping
- **Do NOT use SQLite for**: Multi-user web applications, concurrent writes, production web services, horizontal scaling
- **Right Choice**: Start with PostgreSQL (or MySQL) if building a web application. The initial setup is slightly more complex, but you avoid weeks of migration work later
- **Migration Cost Awareness**: Migrating from SQLite to PostgreSQL requires rewriting all queries, changing connection logic, data migration (risky, can lose data), and testing everything again

**Connection Pooling Guidelines**:
- **Essential from Day One**: Connection pooling is critical for production. Without it, the application creates a new database connection for every request, database connections exhaust under load, and the application fails when too many users connect simultaneously
- **Why It Matters**: Database connections are expensive to create. Pooling reuses connections, dramatically improving performance and preventing connection exhaustion

**Authentication Planning**:
- **Plan Early**: Authentication is architectural. You need to decide:
  1. Token-based (JWT) vs. Session-based (JWT is stateless and scales better; Sessions offer easier revocation)
  2. OAuth2/OpenID Connect for enterprise or social login
  3. Multi-factor Authentication required for admin accounts
- **Why Plan Early**: Authentication affects every protected endpoint, frontend state management, token storage (cookies vs. localStorage), and security middleware. Changing authentication later means refactoring every endpoint.

**Environment Configuration**:
- **Never Hardcode**: Environment variables are essential for different configurations per environment (dev, staging, production), secrets management (never commit secrets to git), feature flags, and external service URLs
- **The `.env` Pattern**: Create `.env.example` (committed to git) with placeholders, and `.env` (never committed, local only) with actual values
- **Why `.env.example`?**: It documents required environment variables without exposing secrets

### Setup Order Guidelines

**Recommended Setup Order**:
1. **Structure First**: You know where code goes
2. **Foundation Before Features**: Core infrastructure is ready
3. **Security Early**: Every feature built on this foundation is secure by default
4. **Tools Ready**: Development workflow is smooth from day one

**Why This Order?**:
- **Database First**: The database schema defines your data model. Building features before the schema is ready leads to multiple schema changes, data migration issues, and inconsistent data models
- **Backend Before Frontend**: The backend defines the API contract. Building frontend before backend means mocking APIs (extra work), changing frontend when API changes, and integration issues later
- **Integration Last**: Full-stack testing happens after components work independently, making debugging easier

### Architecture Principles

**Layered Architecture Guidelines**:
- **Separation of Concerns**: Each layer has a single responsibility:
  - Routes: Handle HTTP (request/response, status codes, headers)
  - Services: Implement business rules (what your app does)
  - Repositories: Access data (how data is stored)
- **Testability**: You can test each layer independently:
  - Test services with mocked repositories
  - Test routes with mocked services
  - Test repositories with test databases
- **Maintainability**: Changes are localized:
  - Change database? Update repositories only
  - Change business logic? Update services only
  - Change API format? Update routes only

**Single Responsibility Principle**:
- **Every file, function, and module should have one clear purpose**
- **Bad Example**: Route handler doing everything (validation, business logic, data access, response)
- **Good Example**: Route handles HTTP only, middleware handles validation, service handles business logic, repository handles data access
- **Why This Matters**: Each piece is testable independently, business logic is reusable (can be called from API, CLI, background jobs), and changes are localized

### Development Workflow Guidelines

**The Right Development Order**:
1. **Plan First**: Review requirements, design database schema, identify API endpoints, create task list
2. **Database First**: Create schema, run migrations, test database structure, add indexes
3. **Backend Next**: Create services (business logic), create routes (API endpoints), add middleware (auth, validation), write tests
4. **Frontend Last**: Create API service layer, build UI components, integrate with backend, write tests
5. **Integration**: Test full flows, fix integration issues, optimize performance

### Common Pitfalls Prevention Guidelines

**Pitfall 1: "We'll Add Security Later"**:
- **The Problem**: Security is architectural. Adding it later means refactoring every endpoint, multiple security review cycles, and potential vulnerabilities in the meantime
- **The Solution**: Build security from day one with authentication middleware from first protected endpoint, input validation from first user input, and security headers from first deployment

**Pitfall 2: "SQLite is Simpler, We'll Migrate Later"**:
- **The Problem**: Database migration is expensive, requiring rewriting all queries, data migration risks, and testing everything again
- **The Solution**: Choose production database from start (PostgreSQL for web applications), connection pooling from day one, and migration system from first schema change

**Pitfall 3: "We'll Document Later"**:
- **The Problem**: Documentation written later is often incomplete, may miss important decisions, and is harder to write (context is lost)
- **The Solution**: Document as you build with README with setup instructions, code comments for complex logic, architecture decisions in docs folder, and API documentation as you build endpoints

**Pitfall 4: "It Works on My Machine"**:
- **The Problem**: Environment differences cause deployment failures, "works for me" debugging sessions, and production issues
- **The Solution**: Use consistent environments with Docker for local development, environment variables for configuration, CI/CD for automated testing, and staging environment that mirrors production

### Configuration Files Guidelines

**`.gitignore` Guidelines**:
- **Never commit**: `.env` files (contain secrets), `node_modules/` (dependencies), build artifacts, IDE configuration, log files, database files

**`.env.example` Guidelines**:
- **Purpose**: Document required variables without exposing secrets
- **Include**: Database connection strings (with placeholders), authentication secrets (with placeholder values), API URLs (with placeholder values), external service keys (with placeholder values)

**`README.md` Guidelines**:
- **Should include**: Project description, setup instructions, environment variable configuration, how to run locally, how to run tests, how to deploy, architecture overview
- **Why This Matters**: Good documentation reduces onboarding time and prevents "how do I set this up?" questions

### Investment Guidelines

**Invest time in**:
1. **Proper project structure** - Makes code maintainable
2. **Production-ready database** - Avoids costly migrations
3. **Security from day one** - Prevents vulnerabilities
4. **Layered architecture** - Makes code testable and maintainable
5. **Good documentation** - Helps team members and future you

**Remember**: Foundational decisions made early compound over time. A one-day shortcut can become a month-long refactor.

---

## Security

### Core Security Principle

**Security is not a feature you add later—it's a fundamental aspect of how you build software.** Every line of code, every API endpoint, and every user interaction must be designed with security in mind from the beginning.

**Key Insight**: Adding security after building features takes 3-4x longer than building securely from the start.

### Authentication & Authorization Guidelines

**The Golden Rule**: **Never trust anything the client sends**. User IDs, roles, permissions—all must come from authenticated tokens, never from request bodies or query parameters.

**Bad Practice**: Accepting user ID from request body
```javascript
// ❌ BAD: Client controls user ID
const userId = req.body.user_id;  // Attacker can set this to any user ID
```

**Good Practice**: Getting user ID from authenticated token
```javascript
// ✅ GOOD: User ID from authenticated token
router.post('/api/orders',
  authenticateToken,  // Middleware verifies token and sets req.user
  async (req, res) => {
    const userId = req.user.id;  // From token, cannot be forged
  }
);
```

**Why This Works**: The authentication middleware verifies the JWT token and extracts the user ID. The client cannot forge this because the token is cryptographically signed.

**Token Storage Guidelines**:
- **Never Use localStorage**: XSS attacks can steal tokens from localStorage, JavaScript can access localStorage (no protection), and tokens persist even after browser closes (security risk)
- **Always Use HTTP-Only Cookies**:
  ```javascript
  res.cookie('auth_token', token, {
    httpOnly: true,    // JavaScript cannot access (XSS protection)
    secure: true,      // Only sent over HTTPS
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  });
  ```
- **Why HTTP-Only Cookies Work**: `httpOnly: true` prevents JavaScript access (XSS protection), `secure: true` ensures HTTPS-only transmission, `sameSite: 'strict'` prevents CSRF attacks, and browser manages cookie lifecycle automatically

**Authorization Guidelines**:
- **Implement Role-Based Access Control (RBAC)** from the start
- **Resource-Level Authorization**: Beyond roles, check if users can access specific resources. Even if a user is authenticated, they shouldn't access resources they don't own
- **Principle**: Always verify resource ownership or admin status before allowing access

### Input Validation & Sanitization Guidelines

**The Rule: Never Trust User Input**

**Every piece of data from users is potentially malicious. Validate and sanitize everything.**

**Validation Strategy**:
1. **Validate at Entry Points**: Validate immediately when data enters your application
   - Why Validate Early: Fail fast (don't process invalid data), clear error messages (validation errors are user-friendly), consistent validation (all endpoints use same rules)
2. **Validate Types, Formats, and Ranges**: Type (string, number, array, object), format (email, URL, UUID, date format), range (minimum/maximum length, minimum/maximum value), pattern (regex for phone numbers, etc.), required (is the field mandatory?)
3. **Sanitize Input**: Sanitization removes or escapes dangerous characters. Even validated input can contain characters that are dangerous in certain contexts (HTML, SQL, shell commands)

**Length Limits Guidelines**:
- **Always set maximum lengths** to prevent DoS attacks
- **Why Length Limits Matter**: Without limits, attackers can send extremely large inputs that consume server memory, slow down processing, and crash the application
- **Array Length Limits**: Limit array sizes to prevent resource exhaustion

### SQL Injection Prevention Guidelines

**The Solution: Parameterized Queries**

**Always use parameterized queries. Never concatenate user input into SQL.**

**Bad Practice**:
```javascript
// ❌ BAD: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**Good Practice**:
```javascript
// ✅ GOOD: Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);
```

**Why This Works**: The database treats the parameter as data, not SQL code. Even if the email contains SQL, it's treated as a string value.

**Field Whitelisting Guidelines**:
- When building dynamic queries (e.g., UPDATE with variable fields), whitelist allowed fields
- **Why Whitelist**: Attackers cannot inject field names (like `admin=true`) because only whitelisted fields are allowed

**Table/Column Names Guidelines**:
- **Never Use User Input for Table/Column Names**: Table and column names are part of the SQL structure, not data. They must be hardcoded or come from a whitelist

### XSS (Cross-Site Scripting) Prevention Guidelines

**The Solution: Escape HTML**

**Always escape HTML entities when rendering user input:**

```javascript
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Framework Protection Guidelines**:
- **Modern frameworks often escape by default**: React automatically escapes content, but be careful if you use `dangerouslySetInnerHTML` which bypasses this protection
- **If you must render HTML**: Use a sanitization library with allowed tags whitelisted

### Rate Limiting & DoS Prevention Guidelines

**Rate Limiting Guidelines**:
- **General API Rate Limit**: 100 requests per 15 minutes window
- **Strict Limit for Authentication Endpoints**: Only 5 login attempts per 15 minutes

**Timeout Guidelines**:
- **Always set timeouts on external API calls**: Without timeouts, a slow external API can tie up your server resources indefinitely
- **Request Body Size Limits**: Limit request body sizes to prevent memory exhaustion (e.g., 10kb for JSON/URL-encoded bodies)

### Secrets Management Guidelines

**Never Hardcode Secrets**:
- Problems with hardcoded secrets: Secret is in version control, secret is visible to anyone with code access, secret cannot be changed without code deployment

**Use Environment Variables**:
- Always use environment variables for secrets
- Validate secret strength at startup (e.g., JWT secrets must be at least 32 characters)
- **Never Log Secrets**: Logs are often stored in less secure locations and accessible to more people than the codebase

**Use Secret Management Services**:
- For production, use secret management services: AWS Secrets Manager, Google Cloud Secret Manager, HashiCorp Vault, Azure Key Vault
- These services provide: Encryption at rest, access control, audit logging, automatic rotation

### Error Handling & Information Disclosure Guidelines

**The Problem: Leaking Information**

Error messages can leak sensitive information: database structure (from SQL errors), file paths (from stack traces), internal logic (from error messages)

**The Solution: Generic Errors, Detailed Logs**

- Log detailed error (for debugging) with context: error message, stack trace, userId, endpoint, requestId
- Send generic error to client: User-friendly message with request ID for support reference

**Why This Works**:
- Clients get user-friendly errors
- Developers get detailed logs for debugging
- Attackers learn nothing about the system

**Structured Error Responses Guidelines**:
- Use consistent error response format for success, validation errors, and authentication errors
- Include request ID in error responses for correlation

### Security Headers Guidelines

**Configure security headers** to protect against common attacks:
- **Content-Security-Policy**: Prevents XSS by controlling resource loading
- **Strict-Transport-Security**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing

### CORS Configuration Guidelines

**Proper CORS Setup**:
- Only allow your frontend URL as origin
- Enable credentials if using cookies
- Restrict methods to necessary ones only (GET, POST, PUT, DELETE)
- Restrict allowed headers (Content-Type, Authorization)

**Why Restrictive CORS Matters**: Without proper CORS, any website can make requests to your API on behalf of users.

### Security-First Development Principles

1. **Security is Architectural, Not Additive**: Security vulnerabilities often stem from architectural decisions. These aren't bugs you can fix with a patch—they're fundamental design flaws
2. **Build Security from Day One**: Prevents vulnerabilities before they're introduced, saves time (3-4x faster than retrofitting), protects users from attacks, reduces risk of data breaches and legal issues
3. **Every Endpoint Must Be Secure**: Every endpoint, every input, every output must be designed with security in mind. There are no shortcuts in security
4. **Never Trust User Input**: Validate and sanitize everything. Never trust the client. Assume all input is malicious
5. **Defense in Depth**: Multiple layers of security ensure that if one layer fails, others protect (Authentication + Authorization + Validation + Sanitization)

### Cost of Retroactive Security

**The harsh reality**: A development team builds an application over 3 months, then conducts a security review. The review finds:
- 5 critical vulnerabilities (SQL injection, XSS, authentication bypass)
- 8 high-severity issues (missing input validation, exposed secrets)
- 15 medium-severity issues (weak error handling, missing rate limiting)

**Fixing these issues requires**:
- Refactoring every endpoint (2-3 weeks)
- Rewriting database queries (1 week)
- Adding validation to all inputs (1 week)
- Implementing proper error handling (1 week)
- Security re-review (1 week)

**Total: 6-7 weeks of additional work** that could have been avoided by building securely from the start.

---

## Code Quality

### Centralized Error Handling Pattern

**Create Custom Error Classes**:
- Base `AppError` class with statusCode and isOperational properties
- Specific error classes: `ValidationError`, `NotFoundError`, `UnauthorizedError`
- Capture stack traces for debugging

**Use Async Handler Wrapper**:
- Automatically catch errors from async route handlers
- Pass errors to centralized error handler middleware

**Centralized Error Handler**:
- Log errors with context (request ID, method, URL, user ID)
- Send generic errors to clients
- Include request ID in error responses
- Only show stack traces in development mode

**Error Handling Best Practices**:
1. **Throw Errors, Don't Return Error Objects**
2. **Use Appropriate HTTP Status Codes** (400, 401, 403, 404, 409, 500)
3. **Include Context in Errors**
4. **Handle Expected Errors Gracefully**

### Structured Logging Guidelines

**Use a Logging Library** (Winston):
- JSON format for log parsing
- File transports for error logs and combined logs
- Console transport for development only
- Timestamps and error stack traces included

**Log with Context**:
- Include: userId, email, requestId, IP, timestamp, endpoint
- Never log secrets or sensitive information
- Use appropriate log levels: debug (development only), info (normal operations), warn (warning conditions), error (error conditions)

**Request ID Tracking**:
- Generate or extract request ID from headers
- Include request ID in response headers
- Include request ID in all logs and error responses
- Enables tracing requests across services

### Code Organization Guidelines

**Keep Functions Small and Focused**:
- Bad: Large function doing multiple things
- Good: Small, focused functions that do one thing

**Use Meaningful Names**:
- Bad: `proc(data)`, `u`, `r`
- Good: `processUserRegistration(userData)`, `user`, `registrationResult`

**Avoid Deep Nesting**:
- Bad: Deep nested if statements
- Good: Early returns to reduce nesting

**Don't Repeat Yourself (DRY)**:
- Extract repeated code into reusable functions

### Memory Management Guidelines

**Avoid Memory Leaks**:
- Bad: Unbounded in-memory stores that grow forever
- Good: Database-backed storage with automatic cleanup
- Use TTL (Time To Live) for temporary data
- Clean up event listeners

### Code Quality Investment

Code quality is an investment that pays dividends:
1. **Maintainability**: Good code is easier to change
2. **Debugging**: Proper error handling and logging make issues easy to find
3. **Reliability**: Testing catches bugs before production
4. **Team Productivity**: Clear code helps everyone work faster

---

## Database

### Database Schema Design Guidelines

**Design Process**:
1. **Identify Entities**: Users, Products, Orders, Payments, etc.
2. **Define Relationships**: One-to-many, many-to-many, one-to-one
3. **Design Schema**: Start with core entities, then relationships

**Primary Keys: UUIDs vs. Auto-Incrementing Integers**:
- **UUIDs (Recommended for Web Applications)**: Globally unique (no collision risk), doesn't expose business information, easy to merge databases, better for distributed systems
- **Auto-Incrementing Integers**: Smaller storage, faster joins, sequential (good for range queries), but exposes business information and has collision risk in distributed systems

**Foreign Keys and Referential Integrity**:
- **Always use foreign keys** with proper constraints
- **Why Foreign Keys Matter**: Data integrity (prevents orphaned records), CASCADE Delete (automatically cleans up related records), RESTRICT Delete (prevents accidental data loss), database-level enforcement (works even if application code has bugs)

**Constraints: Enforce Data Rules**:
- Use constraints to enforce business rules at the database level: NOT NULL, UNIQUE, CHECK constraints
- Examples: Email uniqueness, age range validation, role enum validation

**Indexes: Performance Optimization**:
- **Index Guidelines**: Index Foreign Keys (always), Index Search Columns (WHERE clauses), Index Sort Columns (ORDER BY), Composite Indexes (for multi-column queries), Don't Over-Index (too many indexes slow down writes)
- **When to Index**: Columns in WHERE clauses, columns in JOIN conditions, columns in ORDER BY clauses, foreign key columns
- **When NOT to Index**: Columns rarely queried, columns with very few unique values (low cardinality), columns frequently updated

**Timestamps: Track Data Lifecycle**:
- Always add timestamps to track data lifecycle: `created_at`, `updated_at`
- Use database triggers or application logic to update `updated_at` automatically

### Database Migration Guidelines

**Migration Best Practices**:
1. **Never Edit Existing Migrations**: Migrations that have run in production cannot be changed
2. **Make Migrations Reversible**: Allows rollback if migration causes issues
3. **Zero-Downtime Migrations**: Design migrations that don't require downtime
4. **Test Migrations**: Always test migrations (up and down, with production-like data)

**Zero-Downtime Migration Pattern**:
1. Add nullable column first
2. Backfill data (in application code or separate migration)
3. Make column NOT NULL (after backfill)
4. Remove old column (after code switch)

### Connection Management Guidelines

**Connection Pooling**:
- **Essential for production**: Reuse connections (avoids creating new connections per request), limit connections (prevents exhausting database connections), performance (reusing connections is much faster)
- **Pool Sizing Guidelines**: max = Number of concurrent requests (typically 10-50), min = Keep some connections ready (typically 5-10)
- Formula: `max = (expected_concurrent_requests) + buffer`

### Query Optimization Guidelines

**Avoid N+1 Queries**:
- Bad: N+1 queries (fetch list, then query each item)
- Good: Single query with JOIN

**Use EXPLAIN to Analyze Queries**:
- Use EXPLAIN to understand query performance and identify slow queries

**Limit Result Sets**:
- Always limit result sets to prevent memory exhaustion
- Implement pagination with configurable limits and maximum bounds

### Backup and Recovery Guidelines

**Automated Backups**:
- Daily backups (minimum), hourly for critical systems
- Retention policy (30-90 days)
- Test restores regularly
- Off-site storage
- Encryption

**Point-in-Time Recovery**:
- For critical applications, enable point-in-time recovery to restore to any point in time

### Data Protection Guidelines

**Encryption at Rest**:
- Use cloud-managed databases (most encrypt by default)
- Or use database encryption features

**Column-Level Encryption**:
- For highly sensitive data, encrypt at the application level

**Data Masking for Logs**:
- Mask sensitive data in logs and support tools to protect PII

### Multi-Tenancy Guidelines

**Row-Level Security (RLS)**:
- Use Row-Level Security for multi-tenant applications
- Enable RLS on all multi-tenant tables
- Create policies based on user membership
- Never trust frontend for tenant_id—always obtain from auth claims

**Why RLS Matters**: Database-level enforcement ensures data isolation even if application code has bugs.

### Database Design Principles

Getting database design right from the start:
1. **Prevents Performance Issues**: Proper indexes and query design
2. **Ensures Data Integrity**: Constraints and foreign keys
3. **Enables Safe Changes**: Migration system
4. **Protects Data**: Encryption and backups
5. **Scales with Growth**: Proper design supports growth

---

## Testing

### TDD Fundamentals

**The Three Laws of TDD**:
1. You must write a failing test before writing production code
2. You must not write more of a test than is sufficient to fail
3. You must not write more production code than is sufficient to pass the test

**Guideline**: Follow the three laws strictly. They ensure minimal, focused tests and implementations.

**TDD Cycle: Red-Green-Refactor**:
- **Red Phase**: Write a failing test that defines expected behavior
- **Green Phase**: Write minimal code to make the test pass. Don't optimize yet
- **Refactor Phase**: Improve code quality while keeping all tests green

**Guideline**: Don't skip phases. Complete RED before GREEN, GREEN before REFACTOR.

**TDD vs Traditional Testing**:
- **Traditional Approach**: Write Code → Write Tests → Fix Bugs → Deploy
- **TDD Approach**: Write Tests → Write Code → Refactor → Deploy
- **Key Difference**: Tests drive the design and implementation, not the other way around

### TDD Workflow Guidelines

**Phase 1: Assessment & Planning**:
- Plan before writing any code or tests
- Answer: What problem are we solving? What is the expected behavior? What are the edge cases? What are the acceptance criteria?
- Document requirements and test scenarios before starting. Identify test types needed (Unit, Integration, E2E)

**Phase 2: Red Phase (Write Failing Tests)**:
- Write tests that define expected behavior clearly
- Each test should fail for the right reason. Clear failure messages help understand what needs to be implemented

**Phase 3: Green Phase (Make Tests Pass)**:
- Write the simplest code that makes the test pass
- Don't write more code than necessary. Minimal implementation keeps code simple and tests focused

**Phase 4: Refactor Phase (Improve Code)**:
- Improve code quality while keeping all tests green
- Only refactor when all tests pass. Tests provide safety net for refactoring

**Phase 5: Regression Testing**:
- Always run full test suite after changes
- Verify all existing tests pass and check for any new failures

### Test Types & Pyramid Guidelines

**Test Pyramid Structure**:
- **Unit Tests (60-70%)**: Fast, isolated, test individual functions/components
- **Integration Tests (20-30%)**: Medium speed, test component interactions
- **E2E Tests (5-10%)**: Slow, test complete user workflows

**Unit Tests**:
- Purpose: Test individual functions/components in isolation
- Characteristics: Fast (< 1ms per test), isolated (no external dependencies), many tests (60-70% of test suite), mock external dependencies
- When to Use: Business logic functions, utility functions, component rendering, state management

**Integration Tests**:
- Purpose: Test how multiple components work together
- Characteristics: Medium speed (10-100ms per test), tests interactions between components, some tests (20-30% of test suite), may use test database/API
- When to Use: API endpoints, database operations, service layer interactions, component integration

**E2E Tests**:
- Purpose: Test complete user workflows
- Characteristics: Slow (1-10s per test), tests full system, few tests (5-10% of test suite), uses real browser/database
- When to Use: Critical user journeys, complete workflows, cross-browser testing, production-like scenarios

### Test Structure & Organization Guidelines

**File Naming Conventions**:
- Pattern: `[component/feature].test.[ext]` or `test_[component/feature].[ext]`
- Examples: `calculator.test.ts`, `test_calculator.py`, `Calculator.test.jsx`

**Test Organization**:
- Mirror source structure in test directories
- Separate unit, integration, and e2e test directories

**AAA Pattern (Arrange-Act-Assert)**:
- **Arrange**: Set up test data and conditions
- **Act**: Execute the code under test
- **Assert**: Verify the results
- Clearly separate arrange, act, and assert sections. Makes tests easy to read and understand

### Regression Testing Guidelines

**When to Run Regression Tests**:
- After every code change
- Before committing code
- Before deploying
- After merging branches
- After refactoring

**Regression Test Strategy**:
- **Full Test Suite Run**: Before major releases, after significant changes
- **Targeted Test Run**: After small changes, during development
- **Continuous Regression**: Automated (CI/CD pipeline)

**Handling Test Failures**:
- Never ignore failing tests. Fix immediately
- When a Test Fails: Don't ignore it, investigate root cause, fix immediately (test or code), never comment out failing tests, never skip tests without fixing
- Root Cause Investigation: Is it a real bug? → Fix the code. Is the test wrong? → Fix the test. Is it a flaky test? → Make it stable

### Best Practices Guidelines

1. **Write Tests First**: Write tests before implementation code. Let tests guide design. Write one test at a time
2. **Keep Tests Simple**: One assertion per test when possible. Keep tests focused
3. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
4. **Test Behavior, Not Implementation**: Test what the code does, not how it does it
5. **Use Mocks Wisely**: Mock external dependencies, not the code under test
6. **Keep Tests Independent**: Each test must be independent and can run alone
7. **Test Edge Cases**: Test boundary conditions, error cases, and edge values
8. **Maintain Test Code Quality**: Refactor test code just like production code

### Common Pitfalls & Solutions Guidelines

**Pitfall 1: Testing the Wrong Layer**:
- Problem: Writing tests at the wrong abstraction level
- Solution: Test at the layer where the bug exists
- Guideline: For UI bugs: Test React components, not backend. For API bugs: Test API endpoints, not database. For algorithm bugs: Test the algorithm, not the UI

**Pitfall 2: Flaky Tests**:
- Problem: Tests that sometimes pass, sometimes fail
- Causes: Timing issues, random data, shared state, external dependencies
- Solution: Use fixed timestamps/dates, mock random number generators, isolate tests completely, mock external dependencies

**Pitfall 3: Over-Mocking**:
- Problem: Mocking too much, testing mocks instead of code
- Solution: Only mock external dependencies. Test real code when possible. Use integration tests for complex interactions

**Pitfall 4: Ignoring Test Failures**:
- Problem: Letting tests fail and moving on
- Solution: Fix failing tests immediately. Never skip tests without fixing. Make tests pass before new features

**Pitfall 5: Slow Tests**:
- Problem: Tests take too long to run
- Solution: Use unit tests for fast feedback. Parallelize test execution. Mock slow operations. Use test databases instead of real ones

**Pitfall 6: Brittle Tests**:
- Problem: Tests break when implementation changes (even if behavior is correct)
- Solution: Test behavior, not implementation. Use stable selectors (data-testid). Avoid testing internal state. Focus on user-facing behavior

### Testing UI Features Guidelines

**Core Lesson**: Testing the algorithm ≠ Testing the feature. For UI features, you must test the actual user experience, not just the underlying logic.

**Key Insight**: Tests were written for the wrong layer. They tested the filtering algorithm (which was correct) but missed the actual bugs in the React UI layer (state management, event handling, user interaction flow).

**Guideline**: Always test at the layer where bugs actually occur. For UI features, that's the React component layer, not the backend algorithm layer.

**React Component Testing**:
- Write tests for the actual React components, not just the underlying logic
- Test React state management (useState, useEffect)
- Test UI component rendering (dropdown options, button states)
- Test user interaction flow (complete workflows)

**E2E Testing**:
- Use Playwright or Cypress for E2E tests that test actual browser behavior
- E2E tests with real browsers catch UI bugs that component tests miss
- Use for critical user journeys

**Visual Regression Testing**:
- Use visual regression testing to catch UI issues
- Catches visual issues that functional tests miss (dropdown ordering, layout issues, styling problems)

**Testing Strategy for UI Features**:
- **Unit Tests (70%)**: Pure functions (filtering algorithms, calculations), React components in isolation, utility functions
- **Integration Tests (20%)**: Component interactions, state management (Redux, Zustand), API integration
- **E2E Tests (10%)**: Critical user journeys, complete workflows, cross-browser testing

**What to Test for UI Features**:
- DO Test: User interactions (clicks, typing, selecting), UI state changes (component re-renders, state updates), visual rendering (dropdown options, button states, chart updates), event handling (onClick, onChange, onSubmit), React hooks (useState, useEffect, useMemo, useCallback)
- DON'T Test: Implementation details (internal function names, variable names), third-party libraries (React, React Testing Library - already tested), browser APIs (fetch, localStorage - mock these), algorithm correctness (test in unit tests for pure functions)

---

## Logging & Monitoring

### The Three Pillars of Observability

1. **Metrics**: Numerical measurements over time (request rate, error rate, latency)
2. **Logs**: Event records with context (what happened, when, where)
3. **Traces**: Request flows across services (how a request moves through the system)

### Metrics Guidelines

**Application Metrics**:
- Request rate (requests per second)
- Error rate (errors per second, error percentage)
- Latency (p50, p95, p99 response times)
- Throughput (successful requests per second)

**Infrastructure Metrics**:
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database connections

**Business Metrics**:
- User signups
- Active users
- Revenue
- Conversion rates

### Logging Guidelines

**Log Aggregation**: Use log aggregation services (ELK Stack, Loki, Cloud Services)

**Log Retention Policy**:
- Application Logs: 30-90 days
- Error Logs: 90-180 days
- Audit Logs: 1-2 years (compliance requirement)
- Access Logs: 30-90 days

**Structured Logging**:
- Use structured logging (JSON format) with comprehensive context
- Required Fields: `request_id` (for tracing), `user_id/token` (for user tracking), `timestamp`, `endpoint`, `status_code`, `error_code`
- Avoid Logging: Passwords, tokens, full email addresses, full card numbers
- Always mask PII before logging

### Alerting Guidelines

**Alert Best Practices**:
- Alert on Symptoms, Not Causes
- Avoid Alert Fatigue
- Use Severity Levels: Critical, Warning, Info
- Test Alerts

**Alert Configuration**:
- High error rate alerts
- High latency alerts
- Database connection failure alerts
- Alert notification channels configured (Slack, email, PagerDuty)

### Distributed Tracing Guidelines

**Implement Distributed Tracing**:
- Use OpenTelemetry, Jaeger for distributed tracing
- Request tracing across services
- Trace visualization configured
- Ensure request ID propagates to all services

### Health Checks Guidelines

**Health Check Endpoint**:
- Health check endpoint for monitoring
- Database health check included
- Uptime monitoring configured

---

## Deployment & CI/CD

### Continuous Integration (CI) Guidelines

CI automatically runs tests on every commit to catch bugs before they reach production.

**CI Pipeline**:
- Tests run on every commit
- Linting runs on every commit
- Security scanning runs (npm audit, etc.)
- Build verification in CI

### Continuous Deployment (CD) Guidelines

CD automatically deploys to production. Deployment best practices:
- Automated (no manual steps)
- Tested (run tests before deployment)
- Rollback Plan (can quickly revert if issues)
- Zero-Downtime (deploy without taking service offline)

### Deployment Strategies

**Blue-Green Deployment**: Run two identical production environments. Switch traffic from blue to green.

**Canary Deployment**: Deploy to a small subset of users first.

**Rolling Deployment**: Deploy to servers one at a time.

### Environment Management Guidelines

**Environment Separation**:
- **Development Environment**: Local development, can break things, debug tools enabled, synthetic data only
- **Test Environment**: Automated testing, reset before test runs, synthetic data only
- **Staging Environment**: Mirrors production, final testing, anonymized production data, full monitoring
- **Production Environment**: Real users, real data, highest security, full monitoring and alerting

**Environment-Specific Configuration**:
- Create separate `.env` files per environment
- Different `NODE_ENV` values
- Different `DATABASE_URL` per environment
- Different `JWT_SECRET` per environment
- Different `API_BASE_URL` per environment
- Different `LOG_LEVEL` per environment

**Data Anonymization Guidelines**:
- Replace real emails with `user{N}@test.example.com`
- Replace real names with `Test User {N}`
- Replace phone numbers with `+1-555-000-{N}`
- Keep data structure intact for testing
- Keep relationships intact (user → company → project)

---

## Operations & Incident Response

### Incident Response Guidelines

**Severity Levels**:
- **P0 (Critical)**: Service completely down, data loss
- **P1 (High)**: Major feature broken, significant user impact
- **P2 (Medium)**: Minor feature broken, limited user impact
- **P3 (Low)**: Cosmetic issues, no user impact

**Incident Response Process**:
1. **Detect**: Monitoring alerts or user reports
2. **Assess**: Determine severity and impact
3. **Communicate**: Notify team and stakeholders
4. **Mitigate**: Fix or workaround to restore service
5. **Resolve**: Permanent fix
6. **Post-Mortem**: Learn from the incident

**Runbooks**:
- Create runbooks for common incidents with: Symptoms, diagnosis steps, resolution steps, prevention measures
- Examples: Database connection failure runbook, high error rate runbook, high latency runbook

### Backup & Disaster Recovery Guidelines

**Backup Strategy**:
- **What to Backup**: Database (full database backups), files (user uploads, static assets), configuration (environment variables, secrets), code (version control - Git)
- **Backup Frequency**: Database: Daily (minimum), hourly for critical systems. Files: Daily. Configuration: On every change. Code: Continuous (Git)

**Disaster Recovery Plan**:
- **Recovery Time Objective (RTO)**: How quickly must service be restored? Critical: < 1 hour, Important: < 4 hours, Standard: < 24 hours
- **Recovery Point Objective (RPO)**: How much data loss is acceptable? Critical: < 1 minute (near real-time replication), Important: < 1 hour, Standard: < 24 hours (daily backups)

**Disaster Scenarios to Plan For**:
- Database failure (failover to replica)
- Server failure (auto-scaling, load balancing)
- Region failure (multi-region deployment)
- Data corruption (point-in-time recovery)
- Security breach (incident response plan)

### Performance & Scaling Guidelines

**Load Testing**:
- Test your application under load to identify bottlenecks before production

**Capacity Planning**:
- Plan for growth:
  1. Current Load (measure current usage)
  2. Growth Projections (estimate future growth)
  3. Resource Requirements (calculate needed resources)
  4. Scaling Strategy (plan how to scale)

**Scaling Strategies**:
- Vertical Scaling (larger servers)
- Horizontal Scaling (more servers)
- Database Scaling (read replicas, sharding)
- Caching (reduce database load)

### Security Operations Guidelines

**Security Monitoring**:
- Failed login attempts monitored
- Unusual access patterns detected
- API abuse detected
- Suspicious activity monitoring

**Security Incident Response**:
- Contain plan for security incidents
- Assess plan for security incidents
- Notify plan for security incidents
- Remediate plan for security incidents
- Document plan for security incidents

**Security Audits**:
- Dependency scanning configured
- Regular penetration testing scheduled
- Security-focused code reviews conducted
- Compliance audits scheduled

---

## Compliance & Regulatory

### Data Protection Regulations

**Understand which regulations apply**:
- **GDPR** (EU/UK): Data protection and privacy
- **CCPA** (California): Consumer privacy
- **PCI-DSS** (Payment cards): Payment data security
- **HIPAA** (Healthcare): Health information protection

### GDPR Compliance Guidelines

**User Rights**:
- Right to Access (users can request their data)
- Right to Erasure (users can request data deletion)
- Right to Portability (users can export their data)
- Right to Rectification (users can correct their data)

**Implementation**:
- Implement user data deletion API endpoint
- Implement user data export API endpoint
- Design soft delete vs hard delete strategy
- Implement soft delete for user accounts (30-day grace period)
- Create data export format (JSON/CSV)
- Add UI for user data management

### Data Mapping Guidelines

**Know where personal data flows**:
- Track: Databases, logs, third-party tools
- Create data flow diagrams
- Document all third-party tools that process data
- Document data processing locations
- Create data processing inventory

### Policies Guidelines

**Have basic policies in place**:
- Security policy
- Incident response policy
- Data breach notification workflow
- Privacy policy
- Terms of service
- Ensure tech implementation matches policy promises

---

## Data Protection & PII

### Data Classification Guidelines

**Classify all data fields by sensitivity level** to determine protection requirements.

**Classification Levels**:
- **Highly Sensitive**: PII (name, email, phone, address, ID numbers, payment details, IP)
- **Confidential**: Sensitive business data
- **Internal**: Company internal data
- **Public**: Public-facing data

**Guideline**: Create comprehensive data classification matrix. Document all PII fields in database schema. Use classification to determine handling requirements (masking, encryption, access control).

### Encryption Guidelines

**At Rest**:
- Use cloud-managed database encryption
- Consider column-level encryption for highly sensitive fields
- Integrate with cloud KMS (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault)

**In Transit**:
- HTTPS/TLS everywhere (no plain HTTP)
- Verify database connection uses SSL
- Use security headers (Helmet.js)

**Guideline**: Verify database encryption is enabled. Document encryption strategy.

### Tokenization Guidelines

**Use tokenization for very sensitive data** (ID numbers, regulatory-heavy data).

**Architecture**:
- Store tokenized data in separate table/service (encrypted)
- Main app stores foreign key/token
- Implement strict RBAC for PII access

**Guideline**: Tokenization provides extra protection for highly sensitive data. Design separate PII vault service.

### Masking Guidelines

**Always mask PII in logs, admin UI, and support tools.**

**Pattern**: Example: `vik***@gmail.com`

**Implementation**:
- Create reusable PII masking utilities (email, phone, SSN, etc.)
- Apply masking to all log outputs automatically
- Implement masking in admin UI with "reveal" button
- Mask email addresses, phone numbers, SSN and other sensitive identifiers

**Guideline**: Mask PII automatically in all logs. Provide "reveal" functionality in admin UI with audit logging.

### Automated PII Detection Guidelines

**Detect unmasked PII in logs and warn developers.**

**Pattern**: Create PII detection service that detects unmasked PII in strings/objects

**Implementation**:
- Integrate detection into logger (warns if unmasked PII detected)
- Warn developers but don't block logging (to prevent breaking production)

**Guideline**: Automatically detect unmasked PII in logs. Warn developers but don't block logging.

### Access Control for PII Guidelines

**Implement roles for internal team with appropriate access levels**:
- **Support/CS**: Limited access, masked PII
- **Developer**: Logs/metrics, on-demand PII access
- **Ops/SRE**: Infrastructure + read-only DB access
- **Super Admin**: Full access, sparingly used

**Just-in-Time (JIT) Access for Debugging**:
- Developer requests elevated access for X hours
- Gets approved
- Everything logged
- Time-limited and audited
- Automatic revocation

**Read-Only DB Replicas for Debugging**:
- Use read-only DB replicas for debugging instead of production DB
- Reduces load on primary database
- Prevents accidental writes
- Safer for debugging

### Data Retention Policies Guidelines

**Define clear retention policy for all data types**:
- Logs: 30-90 days
- Detailed events: 1-2 years
- Backups: 30-90 days
- User data: Per GDPR requirements
- Financial data: Per business requirements

**Implementation**:
- Create data retention policy document
- Implement automated cleanup scripts
- Schedule regular cleanup jobs

---

## Production Readiness

### Core Principles

**1. Test-Driven Development (TDD)**:
- Write tests **before** writing implementation code
- Follow RED → GREEN → REFACTOR cycle
- Benefits: Confidence in code changes, living documentation, better code design, regression prevention

**2. Incremental Implementation**:
- Implement **one item at a time**, fully tested before moving to next
- Process: Assess item (TDD applicability, risk, effort), write tests first (if applicable), implement minimal code, run regression tests, document and move to next

**3. Feature Flags for Safety**:
- Use feature flags for **all risky changes**
- Benefits: Safe rollback without code deployment, gradual rollout, A/B testing capability, zero-downtime deployments
- Guideline: Always use feature flags for changes that could break production. Never deploy risky changes without a kill switch.

**4. Backward Compatibility**:
- **Never break existing functionality**
- Strategies: Add new fields as nullable, support both old and new API versions, use feature flags for breaking changes, maintain migration paths

**5. Security by Default**:
- Security is **not optional**, it's built-in
- Practices: PII masking in logs, Row-Level Security (RLS) for multi-tenancy, input validation and sanitization, audit logging for sensitive operations

### Feature Flags Guidelines

**Implementation Pattern**:
```javascript
// Backend
const FeatureFlags = require('./utils/featureFlags');
if (FeatureFlags.isEnabled('NEW_FEATURE')) {
  // New implementation
} else {
  // Old implementation
}

// Frontend
import { isFeatureEnabled } from '@/utils/featureFlags';
if (isFeatureEnabled('NEW_FEATURE')) {
  // New UI
}
```

**Guideline**: Centralize feature flags for safe rollouts and rollbacks. Support both backend and frontend feature flags. Cache flag values for performance.

### API Versioning Guidelines

**Implementation**:
- Version detection (URL path + headers)
- Support backward compatibility (`/api/` → `/api/v1/`)
- Add version info in response headers

**Guideline**: Support both old and new API versions during transition. Document versioning strategy. Implement zero-downtime migration strategy.

### Password Strength Guidelines

**Enforce strong passwords using scoring system**:
- Length check (minimum 12 characters recommended)
- Character variety (lowercase, uppercase, numbers, special characters)
- Common password check
- Score mapping: WEAK, FAIR, GOOD, STRONG

**Guideline**: Reject WEAK and FAIR passwords. Use scoring system based on length and character variety. Check against common passwords.

### Product Safeguards Guidelines

**Add safeguards to prevent accidental data loss**:
- Confirmation dialogs for destructive actions
- Soft delete before hard delete
- Idempotency for critical operations

**Implementation**:
- Use confirmation dialogs for destructive actions
- Implement idempotency middleware for critical operations
- Support soft delete before hard delete

### Admin Tools Guidelines

**Admin Panel with PII Masking**:
- Mask PII by default, provide "reveal" button with audit logging
- Always mask PII in admin interfaces
- Log all PII access for audit purposes
- Require admin authentication for PII access

### Building Production-Grade Systems

Building production-grade systems requires:
1. **Foundation**: Proper project setup and architecture
2. **Security**: Security-first development practices
3. **Quality**: Code quality and best practices
4. **Data**: Solid database design and management
5. **Operations**: Production readiness and operational excellence

Each of these areas is essential. Skipping any one leads to problems that compound over time.

---

## Quick Reference Guidelines

### For Every New Feature

**Guideline**: Follow this checklist for every new feature:
- Write tests first (TDD)
- Use feature flags for risky changes
- Pass `userId` to all database queries (if RLS enabled)
- Mask PII in logs
- Add audit logging for sensitive operations
- Run regression tests
- Update documentation

### For Every Code Change

**Guideline**: Follow this checklist for every code change:
- Run unit tests
- Run integration tests
- Run E2E tests (if applicable)
- Check for PII exposure in logs
- Verify RLS still works (if applicable)
- Update documentation

### Before Production Deployment

**Guideline**: Complete all items before production deployment:
- All tests passing (100%)
- Feature flags configured
- RLS policies enabled (if applicable)
- PII masking enabled
- Monitoring and alerting configured
- Documentation updated
- Rollback plan ready

---

**Document Version**: 1.0  
**Last Updated**: Consolidated from all guideline documents  
**Source**: All `*_guideline.md` files in the standards repository

