#!/bin/bash

# Frontend Design Template Setup Script
# Usage: ./setup-new-project.sh /path/to/new/project

set -e

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$1"

if [ -z "$TARGET_DIR" ]; then
    echo "❌ Error: Please provide target directory"
    echo "Usage: ./setup-new-project.sh /path/to/new/project"
    exit 1
fi

if [ ! -d "$(dirname "$TARGET_DIR")" ]; then
    echo "❌ Error: Parent directory does not exist: $(dirname "$TARGET_DIR")"
    exit 1
fi

echo "🚀 Setting up new project from template..."
echo "📁 Template: $TEMPLATE_DIR"
echo "📁 Target: $TARGET_DIR"
echo ""

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Copy configuration files
echo "📋 Copying configuration files..."
cp "$TEMPLATE_DIR/tailwind.config.ts" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/components.json" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/vite.config.ts" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/tsconfig.json" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/tsconfig.app.json" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/tsconfig.node.json" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/postcss.config.js" "$TARGET_DIR/"
cp "$TEMPLATE_DIR/.gitignore" "$TARGET_DIR/"

# Copy package.json template
echo "📦 Setting up package.json..."
cp "$TEMPLATE_DIR/package.json.template" "$TARGET_DIR/package.json"

# Create src directory structure
echo "📁 Creating directory structure..."
mkdir -p "$TARGET_DIR/src/components/ui"
mkdir -p "$TARGET_DIR/src/lib"
mkdir -p "$TARGET_DIR/src/pages"
mkdir -p "$TARGET_DIR/public"

# Copy design system files
echo "🎨 Copying design system..."
cp "$TEMPLATE_DIR/src-index.css.template" "$TARGET_DIR/src/index.css"
cp "$TEMPLATE_DIR/lib-utils.ts.template" "$TARGET_DIR/src/lib/utils.ts"

# Copy essential UI components (if they exist in template)
if [ -d "$TEMPLATE_DIR/src/components/ui" ]; then
    echo "🧩 Copying UI components..."
    cp -r "$TEMPLATE_DIR/src/components/ui"/* "$TARGET_DIR/src/components/ui/" 2>/dev/null || true
fi

# Create basic App.tsx example
echo "📝 Creating example files..."
cat > "$TARGET_DIR/src/App.tsx" << 'EOF'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-background p-8">
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to Your App
            </h1>
            <p className="mt-4 text-muted-foreground">
              Your frontend design template is ready!
            </p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
EOF

# Create main.tsx
cat > "$TARGET_DIR/src/main.tsx" << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create index.html
cat > "$TARGET_DIR/index.html" << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create .env.example
cat > "$TARGET_DIR/.env.example" << 'EOF'
VITE_API_URL=http://localhost:3000
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. npm install"
echo "  3. Update package.json name and version"
echo "  4. Customize colors in src/index.css if needed"
echo "  5. npm run dev"
echo ""
echo "🎨 To add more UI components:"
echo "  npx shadcn@latest add [component-name]"
echo ""

