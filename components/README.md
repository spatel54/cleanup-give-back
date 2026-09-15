# Animated Sidebar Components

This directory contains the animated sidebar components that work with **Next.js**, **shadcn/ui**, **Tailwind CSS**, and **TypeScript**.

## ⚠️ Important Note

These components are designed for **Next.js web applications** and will NOT work in the existing React Native project. They use:

- `next/link` for navigation
- `framer-motion` for animations (web-only)
- Web-specific CSS classes and DOM elements

## Components Included

- `sidebar.tsx` - Main sidebar component with all functionality
- `sidebar-demo.tsx` - Demo implementation showing usage
- `lib/utils.ts` - Utility function for className merging

## Dependencies Required

```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

## Setup Instructions

### 1. Next.js Project Setup

If you don't have a Next.js project, create one:

```bash
npx create-next-app@latest my-sidebar-project --typescript --tailwind --eslint
cd my-sidebar-project
```

### 2. Install Dependencies

```bash
npm install framer-motion lucide-react clsx tailwind-merge
```

### 3. Setup shadcn/ui (if not already configured)

```bash
npx shadcn@latest init
```

### 4. Copy Components

Copy the components to your Next.js project:

```
src/
├── components/
│   └── ui/
│       ├── sidebar.tsx
│       └── sidebar-demo.tsx
└── lib/
    └── utils.ts
```

### 5. Update Import Paths

Make sure your `tsconfig.json` has the correct path alias:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Usage Example

```tsx
import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function Page() {
  return <SidebarDemo />;
}
```

## Component Structure

### SidebarProvider & useSidebar
- Context provider for sidebar state management
- Handles open/closed state and animation preferences

### Sidebar
- Main wrapper component
- Accepts controlled or uncontrolled state

### SidebarBody
- Renders both desktop and mobile versions
- Responsive design with different behaviors

### DesktopSidebar
- Auto-expands on hover
- Animated width transitions
- Hidden on mobile screens

### MobileSidebar
- Toggle button in header
- Full-screen overlay when open
- Slide-in animation

### SidebarLink
- Individual navigation items
- Icon + label with animation
- Integrates with Next.js routing

## Key Features

- **Responsive Design**: Different behavior on desktop vs mobile
- **Hover Interactions**: Auto-expand on desktop hover
- **Smooth Animations**: Powered by Framer Motion
- **Dark Mode Support**: Built-in dark/light theme classes
- **Accessible**: Keyboard navigation and screen reader support
- **Customizable**: Easy to modify styles and behavior

## Customization

The component uses Tailwind classes and can be customized by:

1. Modifying the `className` props
2. Adjusting animation timings in Framer Motion config
3. Changing colors in the Tailwind classes
4. Adding custom CSS for specific requirements

## Integration with Existing Project

To use this in your **Clean Up - Give Back** project, you would need to:

1. Create a separate Next.js web application
2. Set up the sidebar there
3. Use it for admin dashboards or web-based management interfaces

The existing React Native app would continue to use native navigation components.