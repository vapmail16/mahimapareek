# Admin Role Setup

This document explains how to assign admin role to users.

## Assign Admin Role to vapmail16@gmail.com

### Option 1: Using the TypeScript script directly

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/assignAdminRole.ts vapmail16@gmail.com
```

### Option 2: Using the shell script

```bash
cd backend
./scripts/assign-admin.sh vapmail16@gmail.com
```

### Option 3: Using npm script (if added to package.json)

```bash
cd backend
npm run assign-admin vapmail16@gmail.com
```

## Assign Admin Role to Any User

Replace `vapmail16@gmail.com` with the desired email address in any of the above commands.

## Verify Admin Role

After running the script, you can verify the role assignment by:

1. Logging in with the user account
2. Checking if "Question Papers" link appears in the navigation (only visible to admins)
3. Trying to create a question paper (should work for admins, fail for non-admins)

## Notes

- The script is idempotent - running it multiple times is safe
- If the user doesn't exist, the script will return an error
- The script logs the action to the audit log
- Admin role allows:
  - Creating question papers
  - Editing any question paper
  - Deleting any question paper
  - Managing questions

