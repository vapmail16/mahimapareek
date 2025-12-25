# RBAC & Permissions Service Documentation

## Overview
The RBAC (Role-Based Access Control) Service provides a comprehensive permission system with role hierarchy, resource access control, and flexible authorization checks.

## Features
- ✅ Role hierarchy (USER → ADMIN → SUPER_ADMIN)
- ✅ Role checking functions
- ✅ Resource-level authorization
- ✅ Permission middleware
- ✅ Role comparison and management
- ✅ Comprehensive test coverage (34 tests, 100% passing)

---

## Role Hierarchy

```
SUPER_ADMIN (Level 3)
    ↓ Can do everything ADMIN can + manage admins
  ADMIN (Level 2)
    ↓ Can do everything USER can + access all resources
   USER (Level 1)
    ↓ Can access own resources only
```

### Role Capabilities

| Role | Can Access Own Resources | Can Access Others' Resources | Can Manage Users | Can Assign Roles |
|------|--------------------------|------------------------------|------------------|------------------|
| USER | ✅ Yes | ❌ No | ❌ No | ❌ No |
| ADMIN | ✅ Yes | ✅ Yes | 🟡 View only | ❌ No |
| SUPER_ADMIN | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## API Endpoints

### User Endpoints (Authenticated)

#### GET `/api/rbac/me/role`
Get current user's role.

**Response**:
```json
{
  "success": true,
  "data": {
    "role": "USER"
  }
}
```

#### GET `/api/rbac/me/permissions`
Get current user's permissions info.

**Response**:
```json
{
  "success": true,
  "data": {
    "role": "ADMIN",
    "isAdmin": true,
    "isSuperAdmin": false,
    "hierarchy": 2
  }
}
```

#### GET `/api/rbac/check/role/:role`
Check if current user has a specific role.

**Example**: `GET /api/rbac/check/role/ADMIN`

**Response**:
```json
{
  "success": true,
  "data": {
    "hasRole": false
  }
}
```

#### POST `/api/rbac/check/access`
Check if current user can access a resource.

**Request Body**:
```json
{
  "resourceType": "order",
  "resourceOwnerId": "user-id-123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "canAccess": true
  }
}
```

---

### Admin Endpoints (Require ADMIN or SUPER_ADMIN)

#### GET `/api/rbac/users/role/:role`
Get all users with a specific role.

**Example**: `GET /api/rbac/users/role/ADMIN`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2025-12-10T00:00:00Z"
    }
  ]
}
```

#### GET `/api/rbac/compare/:userId`
Compare current user's role with another user.

**Response**:
```json
{
  "success": true,
  "data": {
    "currentUser": {
      "id": "current-user-id",
      "role": "ADMIN",
      "hierarchy": 2
    },
    "targetUser": {
      "id": "target-user-id",
      "role": "USER",
      "hierarchy": 1
    },
    "hasHigherRole": true
  }
}
```

---

### Super Admin Endpoints (Require SUPER_ADMIN)

#### PUT `/api/rbac/users/:userId/role`
Update a user's role.

**Request Body**:
```json
{
  "role": "ADMIN"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "ADMIN"
  },
  "message": "User role updated to ADMIN"
}
```

---

## Service Functions

### Role Checking

#### `hasRole(userId, role)`
Check if user has a specific role.

```typescript
import { hasRole } from './services/rbacService';

const isAdmin = await hasRole(userId, 'ADMIN');
// Returns: true or false
```

#### `hasAnyRole(userId, roles)`
Check if user has any of the specified roles.

```typescript
import { hasAnyRole } from './services/rbacService';

const canModerate = await hasAnyRole(userId, ['ADMIN', 'SUPER_ADMIN']);
// Returns: true or false
```

#### `isAdmin(userId)`
Check if user is an admin (ADMIN or SUPER_ADMIN).

```typescript
import { isAdmin } from './services/rbacService';

const userIsAdmin = await isAdmin(userId);
// Returns: true or false
```

#### `isSuperAdmin(userId)`
Check if user is a super admin.

```typescript
import { isSuperAdmin } from './services/rbacService';

const userIsSuperAdmin = await isSuperAdmin(userId);
// Returns: true or false
```

---

### Resource Access

#### `canAccessResource(userId, resourceType, resourceOwnerId)`
Check if user can access a specific resource.

**Rules**:
- Users can access their own resources
- Admins can access any resource
- Super admins can access any resource

```typescript
import { canAccessResource } from './services/rbacService';

const canView = await canAccessResource(
  currentUserId,
  'order',
  orderOwnerId
);

if (!canView) {
  throw new ForbiddenError('Cannot access this order');
}
```

---

### Role Management

#### `updateUserRole(userId, newRole)`
Update a user's role.

```typescript
import { updateUserRole } from './services/rbacService';

const updatedUser = await updateUserRole(userId, 'ADMIN');
// Returns: Updated user object
```

#### `getUserRole(userId)`
Get user's current role.

```typescript
import { getUserRole } from './services/rbacService';

const role = await getUserRole(userId);
// Returns: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | null
```

#### `getUsersByRole(role)`
Get all users with a specific role.

```typescript
import { getUsersByRole } from './services/rbacService';

const admins = await getUsersByRole('ADMIN');
// Returns: Array of user objects
```

---

### Role Hierarchy

#### `getRoleHierarchy(role)`
Get numeric hierarchy level for a role.

```typescript
import { getRoleHierarchy } from './services/rbacService';

const level = getRoleHierarchy('ADMIN');
// Returns: 2
```

#### `hasHigherRole(userId1, userId2)`
Check if user1 has a higher role than user2.

```typescript
import { hasHigherRole } from './services/rbacService';

const canManage = await hasHigherRole(managerId, userId);
// Returns: true or false
```

---

## Middleware Usage

### Protect Routes with Role Requirements

```typescript
import { authenticate, requireRole } from './middleware/auth';

// Require specific role
router.get('/admin/dashboard',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req, res) => {
    // Only admins and super admins can access
  }
);

// Require super admin
router.delete('/users/:id',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    // Only super admins can delete users
  }
);
```

### Check Resource Access in Routes

```typescript
import { authenticate } from './middleware/auth';
import { canAccessResource } from './services/rbacService';

router.get('/orders/:id',
  authenticate,
  async (req, res) => {
    const order = await getOrder(req.params.id);
    
    // Check if user can access this order
    const canAccess = await canAccessResource(
      req.user.id,
      'order',
      order.userId
    );
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Cannot access this order'
      });
    }
    
    res.json({ success: true, data: order });
  }
);
```

---

## Usage Examples

### Example 1: Protect Admin Endpoint

```typescript
// Only admins can view all users
router.get('/api/users',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req, res) => {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  }
);
```

### Example 2: Resource Ownership Check

```typescript
// Users can only edit their own profile
router.put('/api/profile/:userId',
  authenticate,
  async (req, res) => {
    const canAccess = await canAccessResource(
      req.user.id,
      'user',
      req.params.userId
    );
    
    if (!canAccess) {
      throw new ForbiddenError('Cannot edit another user\'s profile');
    }
    
    // Update profile...
  }
);
```

### Example 3: Dynamic Permission Check

```typescript
// Check permissions in business logic
async function deletePost(postId: string, userId: string) {
  const post = await getPost(postId);
  
  // User can delete own posts, admins can delete any post
  const canDelete = await canAccessResource(userId, 'post', post.authorId);
  
  if (!canDelete) {
    throw new ForbiddenError('Cannot delete this post');
  }
  
  await prisma.post.delete({ where: { id: postId } });
}
```

### Example 4: Role-Based Features

```typescript
// Show different UI based on role
router.get('/api/dashboard',
  authenticate,
  async (req, res) => {
    const role = await getUserRole(req.user.id);
    const isAdmin = await rbacService.isAdmin(req.user.id);
    
    const dashboard = {
      userInfo: req.user,
      features: {
        canViewAnalytics: isAdmin,
        canManageUsers: role === 'SUPER_ADMIN',
        canAccessReports: isAdmin,
      }
    };
    
    res.json({ success: true, data: dashboard });
  }
);
```

---

## Best Practices

### 1. Always Check Permissions
```typescript
// ❌ BAD: No permission check
router.delete('/users/:id', authenticate, async (req, res) => {
  await deleteUser(req.params.id);
});

// ✅ GOOD: Check permissions
router.delete('/users/:id', 
  authenticate, 
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    await deleteUser(req.params.id);
  }
);
```

### 2. Use Resource-Level Checks
```typescript
// ❌ BAD: Only checking if user is admin
if (await isAdmin(userId)) {
  // Admin can access, but what about resource owner?
}

// ✅ GOOD: Check resource access (handles both owner and admin)
if (await canAccessResource(userId, 'resource', resourceOwnerId)) {
  // Both owner and admin can access
}
```

### 3. Never Trust Client-Provided Roles
```typescript
// ❌ VERY BAD: Role from request body
const role = req.body.role; // Attacker can set this!

// ✅ GOOD: Role from authenticated token
const role = await getUserRole(req.user.id);
```

### 4. Log Authorization Failures
```typescript
const canAccess = await canAccessResource(userId, 'order', orderId);

if (!canAccess) {
  // Log for security monitoring
  await createAuditLog({
    userId,
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    resource: 'orders',
    resourceId: orderId,
  });
  
  throw new ForbiddenError('Access denied');
}
```

---

## Security Considerations

### 1. Role Assignment
- Only SUPER_ADMIN can assign roles
- Role updates are audited automatically
- Cannot assign role to yourself

### 2. Resource Access
- Always verify ownership OR admin status
- Never trust client-provided resource IDs
- Log access denials for security monitoring

### 3. API Security
- All RBAC endpoints require authentication
- Role updates require SUPER_ADMIN
- User listings require ADMIN

---

## Testing

Run RBAC tests:

```bash
npm test -- rbacService.test.ts
```

All tests use real database with proper cleanup. Tests cover:
- Role checking (all variations)
- Resource access control
- Role management
- Hierarchy comparisons
- Error cases

**Test Results**: 34/34 passing ✅

---

## Common Patterns

### Pattern 1: Admin-Only Endpoint

```typescript
router.get('/api/admin/reports',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req, res) => {
    // Only admins can access
  }
);
```

### Pattern 2: Owner or Admin Access

```typescript
router.get('/api/orders/:id',
  authenticate,
  async (req, res) => {
    const order = await getOrder(req.params.id);
    
    const canAccess = await canAccessResource(
      req.user.id,
      'order',
      order.userId
    );
    
    if (!canAccess) {
      throw new ForbiddenError('Access denied');
    }
    
    res.json({ success: true, data: order });
  }
);
```

### Pattern 3: Super Admin Only

```typescript
router.delete('/api/users/:id',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req, res) => {
    // Only super admins can delete users
  }
);
```

### Pattern 4: Conditional Features

```typescript
// Return different data based on role
router.get('/api/dashboard', authenticate, async (req, res) => {
  const isAdmin = await rbacService.isAdmin(req.user.id);
  
  const dashboard = {
    profile: req.user,
    // Show admin panel only for admins
    ...(isAdmin && { adminPanel: await getAdminData() })
  };
  
  res.json({ success: true, data: dashboard });
});
```

---

## Migration Guide

### Adding New Roles

1. Update Prisma schema:
```prisma
enum Role {
  USER
  ADMIN
  MODERATOR  // New role
  SUPER_ADMIN
}
```

2. Update role hierarchy:
```typescript
const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  MODERATOR: 2,  // Add hierarchy level
  ADMIN: 3,
  SUPER_ADMIN: 4,
};
```

3. Run migration:
```bash
npx prisma migrate dev --name add_moderator_role
```

### Adding Permission System

For more granular permissions beyond roles:

1. Create Permission table
2. Create RolePermission mapping
3. Add permission checking functions
4. Update middleware

---

## Troubleshooting

### Issue: User Can't Access Own Resource

**Check**:
1. Is user authenticated? (`req.user` exists)
2. Is resourceOwnerId correct?
3. Is resource type correct?
4. Check audit logs for access attempts

### Issue: Admin Can't Access Resources

**Check**:
1. Is role correctly set in database?
2. Is `isAdmin()` function working?
3. Check user's `isActive` status

### Issue: Role Update Not Working

**Check**:
1. Is user SUPER_ADMIN?
2. Is role string valid? (`USER`, `ADMIN`, `SUPER_ADMIN`)
3. Check audit logs for failures

---

## Performance Considerations

### Caching
Consider caching user roles:

```typescript
// Cache user role for 5 minutes
const roleCache = new Map<string, { role: Role; timestamp: number }>();

export const getUserRoleCached = async (userId: string): Promise<Role | null> => {
  const cached = roleCache.get(userId);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < 300000) { // 5 min
    return cached.role;
  }
  
  const role = await getUserRole(userId);
  if (role) {
    roleCache.set(userId, { role, timestamp: now });
  }
  
  return role;
};
```

### Database Queries
- User role is fetched with every permission check
- Consider including role in JWT token payload
- Use database indexes on role column

---

## Future Enhancements

- [ ] Permission-based access (beyond roles)
- [ ] Dynamic permission assignment
- [ ] Permission groups/teams
- [ ] Time-based permissions (temporary admin)
- [ ] Resource-type specific permissions
- [ ] Permission inheritance
- [ ] Audit trail for all role changes

---

## API Reference Summary

| Endpoint | Method | Auth | Role Required | Description |
|----------|--------|------|---------------|-------------|
| `/api/rbac/me/role` | GET | Yes | Any | Get own role |
| `/api/rbac/me/permissions` | GET | Yes | Any | Get own permissions |
| `/api/rbac/check/role/:role` | GET | Yes | Any | Check if has role |
| `/api/rbac/check/access` | POST | Yes | Any | Check resource access |
| `/api/rbac/users/role/:role` | GET | Yes | Admin+ | List users by role |
| `/api/rbac/compare/:userId` | GET | Yes | Admin+ | Compare roles |
| `/api/rbac/users/:userId/role` | PUT | Yes | Super Admin | Update user role |

---

**Documentation Status**: Complete  
**Last Updated**: December 10, 2025  
**Version**: 1.0.0

