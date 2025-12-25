# Quick Reference Guide

## Using This Template in New Projects

### Method 1: Automated Setup (Recommended)

```bash
cd /Users/user/Desktop/AI/projects/saas_building_checklist/frontend-design-template
./setup-new-project.sh /path/to/your/new-project/frontend
cd /path/to/your/new-project/frontend
npm install
npm run dev
```

### Method 2: Manual Copy

```bash
# Copy all template files to your new project
cp -r /Users/user/Desktop/AI/projects/saas_building_checklist/frontend-design-template/* /path/to/your/new-project/frontend/

# Rename package.json.template to package.json and edit it
cd /path/to/your/new-project/frontend
mv package.json.template package.json
# Edit package.json to update name and version

# Install dependencies
npm install
```

## Design System Colors

The template uses CSS variables for colors. Edit `src/index.css` to customize:

### Primary Colors
- `--primary`: Main brand color (Legal Blue by default)
- `--primary-foreground`: Text on primary background
- `--primary-light`: Lighter variant
- `--primary-dark`: Darker variant

### Status Colors
- `--success`: Green for success states
- `--warning`: Amber for warnings
- `--destructive`: Red for errors/destructive actions

### Neutral Colors
- `--background`: Page background
- `--foreground`: Main text color
- `--muted`: Subtle backgrounds
- `--border`: Border colors

## Adding More Components

Use shadcn/ui CLI to add components:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
# etc.
```

## Common Patterns

### Using the Design System

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function MyComponent() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold text-foreground">
        Title
      </h2>
      <Button className="mt-4">Click Me</Button>
    </Card>
  );
}
```

### Dark Mode

The template includes dark mode support. Use `next-themes` to toggle:

```tsx
import { ThemeProvider } from "next-themes";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## File Locations

- **Design System**: `src/index.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Components**: `src/components/ui/`
- **Utilities**: `src/lib/utils.ts`
- **Config**: `components.json` (shadcn/ui)

## Customization Checklist

When starting a new project:

- [ ] Update `package.json` name and version
- [ ] Customize colors in `src/index.css`
- [ ] Update `index.html` title
- [ ] Add your logo to `public/`
- [ ] Configure API URL in `.env`
- [ ] Add required shadcn/ui components
- [ ] Set up routing (React Router)
- [ ] Configure authentication (if needed)

## Need Help?

Refer to:
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)

