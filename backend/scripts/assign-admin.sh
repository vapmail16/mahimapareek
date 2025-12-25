#!/bin/bash

# Script to assign admin role to vapmail16@gmail.com
# Usage: ./assign-admin.sh [email]

EMAIL="${1:-vapmail16@gmail.com}"

echo "Assigning ADMIN role to ${EMAIL}..."

cd "$(dirname "$0")/.."

# Run the TypeScript script using ts-node
npx ts-node -r tsconfig-paths/register src/scripts/assignAdminRole.ts "$EMAIL"

if [ $? -eq 0 ]; then
  echo "✅ Admin role assigned successfully!"
else
  echo "❌ Failed to assign admin role"
  exit 1
fi

