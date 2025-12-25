# Quick Start Guide - Mahimapareek.com

**Purpose**: Quick reference for starting development  
**Full Plan**: See `IMPLEMENTATION_PLAN.md`

---

## Project Overview

**Goal**: Recreate Mahimapareek.com + Add Answer Paper Grading System

**Key Features**:
1. ✅ Website recreation (blog, categories, content)
2. ✅ User authentication (students, educators, admins)
3. ✅ Question paper management (educators)
4. ✅ Answer paper upload (students)
5. ✅ Automated AI grading
6. ✅ Results & analytics

---

## Technology Stack

### Backend
- Node.js + Express.js (TypeScript) - **REUSE from template**
- PostgreSQL + Prisma - **REUSE from template**
- JWT authentication (HTTP-only cookies) - **REUSE from template**
- Email service (Resend) - **REUSE from template**
- Payment gateway (Stripe, Razorpay, Cashfree) - **REUSE from template**
- GDPR compliance - **REUSE from template**
- Winston logging - **REUSE from template**
- Jest testing - **REUSE from template**

### Frontend
- React 18 + TypeScript + Vite
- shadcn/ui (from standards template)
- Tailwind CSS
- React Query
- React Router

---

## Development Order (TDD)

### Phase 1: Foundation (Week 1-2)
1. Copy backend template (auth, email, payment, GDPR already included)
2. Extend database schema (add blog, question papers, answer papers tables)
3. Integrate authentication (reuse from template - already tested)
4. Blog/content management (TDD) - NEW feature
5. Frontend recreation - NEW feature

### Phase 2: Question Papers (Week 3-4)
1. Question paper CRUD (TDD)
2. Question management (TDD)
3. Frontend UI

### Phase 3: Answer Upload (Week 5)
1. File upload system (TDD)
2. Answer submission (TDD)
3. File processing

### Phase 4: Grading (Week 6-7)
1. AI integration (TDD)
2. Grading logic (TDD)
3. Feedback generation (TDD)
4. Manual review

### Phase 5: Results (Week 8)
1. Results display (TDD)
2. Export functionality (TDD)
3. Analytics dashboard

### Phase 6: Production (Week 9-10)
1. Advanced features
2. Security hardening
3. Testing & deployment

---

## Quick Commands

### Setup
```bash
# Copy backend template (includes auth, email, payment, GDPR)
cp -r /Users/user/Desktop/AI/projects/template/backend/* ./backend/

# Copy frontend template
cp -r /Users/user/Desktop/AI/projects/standards/frontend-design-template/* ./frontend/

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Database
```bash
# Initialize Prisma
cd backend && npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Development
```bash
# Backend (with hot-reload)
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Run tests
npm test
```

---

## Key Database Tables

1. **users** - User accounts (students, educators, admins)
2. **categories** - Blog categories
3. **posts** - Blog posts/articles
4. **question_papers** - Question papers created by educators
5. **questions** - Individual questions
6. **answer_papers** - Student submissions
7. **question_answers** - Individual question answers
8. **ai_grading_results** - AI grading audit trail

---

## TDD Workflow

For each feature:
1. **RED**: Write failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code
4. **REPEAT**: Next test case

---

## Security Checklist

- [ ] JWT in HTTP-only cookies
- [ ] Role-based access control
- [ ] Input validation (Zod)
- [ ] SQL injection prevention (Prisma)
- [ ] File upload validation
- [ ] Rate limiting
- [ ] PII masking in logs

---

## Reusable Components

**Backend Template**: `/Users/user/Desktop/AI/projects/template/backend/`

✅ **Authentication** - Register, login, logout, refresh tokens  
✅ **Email Service** - Resend integration with templates  
✅ **Payment Gateway** - Stripe, Razorpay, Cashfree  
✅ **GDPR Compliance** - Data export, deletion, consent  
✅ **RBAC** - Role-based access control  
✅ **Audit Logging** - Activity tracking  
✅ **Security** - Helmet, CORS, rate limiting  
✅ **Logging** - Winston with PII masking  
✅ **127+ Tests** - TDD approach, ready to use

## Next Steps

1. Review `IMPLEMENTATION_PLAN.md`
2. Copy backend template to project
3. Extend database schema (add new tables)
4. Start with blog/content management (TDD) - auth already done!

---

**See Full Plan**: `docs/IMPLEMENTATION_PLAN.md`

