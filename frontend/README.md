# Frontend Design Template

A reusable frontend design system template based on the JurisAid design. Use this template to quickly bootstrap new applications with a consistent, professional design system.

**Location**: Part of the SaaS Building Checklist standards project

## What's Included

- **Design System**: Complete color palette, typography, spacing, and animations
- **UI Components**: shadcn/ui components with Radix UI primitives
- **Configuration**: Pre-configured Tailwind CSS, Vite, TypeScript setup
- **Dark Mode**: Full dark mode support with CSS variables
- **Professional Theme**: Legal/professional color scheme ready to customize

## Quick Start

### Option 1: Copy Template to New Project

```bash
# Navigate to your new project
cd /path/to/your/new-project

# Copy the template files
cp -r /Users/user/Desktop/AI/projects/saas_building_checklist/frontend-design-template/* .

# Install dependencies
npm install
```

### Option 2: Use the Setup Script (Recommended)

```bash
# Run the setup script
cd /Users/user/Desktop/AI/projects/saas_building_checklist/frontend-design-template
./setup-new-project.sh /path/to/your/new-project/frontend
```

## Project Structure

```
frontend-design-template/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts     # Utility functions (cn helper)
│   ├── index.css        # Design system CSS variables
│   └── App.tsx          # Example app structure
├── tailwind.config.ts   # Tailwind configuration
├── components.json      # shadcn/ui configuration
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
└── README.md           # This file
```

## Design System

### Color Palette

The template uses a professional color scheme with CSS variables:

- **Primary**: Legal Blue (Trust & Authority)
- **Secondary**: Professional Highlight
- **Success**: Green for positive actions
- **Warning**: Amber for warnings
- **Destructive**: Red for errors/destructive actions
- **Muted**: Subtle backgrounds and borders

All colors support light and dark modes.

### Typography

- **Font Family**: Inter (with system fallbacks)
- **Font Smoothing**: Antialiased for crisp text
- **Headings**: Semibold with tight tracking

### Components

All shadcn/ui components are included:
- Buttons, Cards, Dialogs, Forms
- Inputs, Selects, Textareas
- Navigation, Sidebar, Tabs
- Toast notifications, Tooltips
- And many more...

## Customization

### Changing Colors

Edit `src/index.css` to modify the color palette:

```css
:root {
  --primary: 216 87% 35%;  /* Change this HSL value */
  --secondary: 350 85% 50%;
  /* ... */
}
```

### Adding Components

Use shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add [component-name]
```

### Modifying Theme

Edit `tailwind.config.ts` to customize:
- Spacing scale
- Border radius
- Font sizes
- Animations

## Usage in New Projects

1. **Copy the template** to your new project's frontend directory
2. **Install dependencies**: `npm install`
3. **Update package.json** name and version
4. **Customize colors** in `src/index.css` if needed
5. **Start building** your application!

## Key Features

✅ **Production Ready**: All configurations optimized for production
✅ **Type Safe**: Full TypeScript support
✅ **Accessible**: Radix UI components are accessible by default
✅ **Customizable**: Easy to modify colors, spacing, and components
✅ **Dark Mode**: Built-in dark mode support
✅ **Responsive**: Mobile-first design approach
✅ **Fast**: Vite for lightning-fast development

## Dependencies

Core dependencies included:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (Radix UI)
- React Router
- React Hook Form
- Zod (validation)
- Lucide React (icons)

## Support

For questions or issues, refer to:
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)

---

**Note**: This template is based on the JurisAid design system. Customize colors, fonts, and components to match your brand identity.

