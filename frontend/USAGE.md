# How to Use This Template

## Overview

This template contains the complete frontend design system from JurisAid. Instead of copying from the juris-aid project every time, you can use this template to quickly bootstrap new applications.

## Quick Start

### Step 1: Run the Setup Script

```bash
cd /Users/user/Desktop/AI/projects/saas_building_checklist/frontend-design-template
./setup-new-project.sh /path/to/your/new-project/frontend
```

This will:
- Copy all configuration files
- Set up the directory structure
- Copy the design system (colors, typography, etc.)
- Create example files
- Set up package.json

### Step 2: Install Dependencies

```bash
cd /path/to/your/new-project/frontend
npm install
```

### Step 3: Customize

1. **Update package.json**: Change the name and version
2. **Customize colors**: Edit `src/index.css` if you want different colors
3. **Add components**: Use `npx shadcn@latest add [component]` to add more UI components

### Step 4: Start Development

```bash
npm run dev
```

## What Gets Copied

### Configuration Files
- `tailwind.config.ts` - Tailwind CSS configuration with design system
- `components.json` - shadcn/ui configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.js` - PostCSS configuration

### Design System
- `src/index.css` - Complete color palette, typography, animations
- All CSS variables for light/dark mode
- Custom gradients and shadows

### Essential Files
- `src/lib/utils.ts` - Utility functions (cn helper for className merging)
- Basic UI components (Button, Card, Input, Label)
- Example App.tsx and main.tsx

## Adding More Components

The template includes basic components. To add more shadcn/ui components:

```bash
# Make sure you're in your project directory
cd /path/to/your/new-project/frontend

# Add components as needed
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add table
# etc.
```

## Customizing the Design

### Change Colors

Edit `src/index.css`:

```css
:root {
  --primary: 216 87% 35%;  /* Change to your brand color */
  --secondary: 350 85% 50%;
  /* ... */
}
```

### Change Fonts

Edit `tailwind.config.ts`:

```ts
fontFamily: {
  sans: ['Your Font', 'system-ui', 'sans-serif'],
}
```

### Add Custom Animations

Edit `tailwind.config.ts` in the `keyframes` and `animation` sections.

## Example: Starting a New Project

```bash
# 1. Create your new project
mkdir my-new-app
cd my-new-app

# 2. Set up frontend from template
/Users/user/Desktop/AI/projects/saas_building_checklist/frontend-design-template/setup-new-project.sh ./frontend

# 3. Install dependencies
cd frontend
npm install

# 4. Update package.json name
# Edit package.json and change "name" field

# 5. Start developing
npm run dev
```

## Benefits

✅ **Consistent Design**: All projects use the same design system
✅ **Fast Setup**: No need to copy files manually
✅ **Up to Date**: Template includes latest configurations
✅ **Customizable**: Easy to modify colors, fonts, components
✅ **Production Ready**: All configurations optimized for production

## Maintenance

When you update the design system in juris-aid:

1. Update the template files
2. Copy new design system changes to template
3. Update this README if needed

## Troubleshooting

### Components not found

Make sure you've run `npx shadcn@latest add [component]` for each component you need.

### Colors not working

Check that `src/index.css` is imported in your main entry file.

### TypeScript errors

Run `npm install` to ensure all dependencies are installed.

---

**Remember**: This template is a starting point. Customize it to match your brand and requirements!

