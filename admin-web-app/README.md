# Clean Up - Give Back Web App

This is the web version of the Clean Up - Give Back application, built with Next.js and featuring an animated sidebar navigation.

## Features

- **Animated Sidebar**: Responsive sidebar that collapses on desktop hover and has mobile overlay
- **Clean Design**: Modern UI with Tailwind CSS
- **Dark Mode Support**: Automatic dark/light theme switching
- **Responsive**: Works on desktop and mobile devices
- **Clean Up - Give Back Branding**: Custom logo and green color scheme

## Tech Stack

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Lucide React**: Modern icon library

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── dashboard/       # Dashboard page
│   ├── events/         # Events management
│   ├── volunteers/     # Volunteer management
│   ├── orders/         # Shop orders
│   ├── analytics/      # Analytics & reports
│   ├── profile/        # User profile
│   └── settings/       # App settings
├── components/
│   └── ui/
│       ├── sidebar.tsx      # Main sidebar component
│       └── sidebar-demo.tsx # Sidebar with demo content
└── lib/
    └── utils.ts        # Utility functions
```

## Sidebar Features

### Desktop
- Auto-expands on hover (300px → 60px)
- Smooth width animations
- Always visible navigation

### Mobile
- Hamburger menu trigger
- Full-screen overlay
- Slide-in animation
- Easy close with X button

### Navigation Links
- Dashboard - Main overview
- Events - Event management
- Volunteers - Volunteer coordination  
- Shop Orders - Order fulfillment
- Analytics - Data and reports
- Profile - User settings
- Settings - App configuration

## Customization

The sidebar can be customized by modifying:

- **Colors**: Update Tailwind classes in `sidebar.tsx`
- **Animation**: Adjust Framer Motion configs
- **Logo**: Update the `Logo` and `LogoIcon` components
- **Links**: Modify the links array in `sidebar-demo.tsx`

## Integration with Backend

This web app is designed to work alongside the React Native mobile app and can connect to the same backend services:

- **Admin Panel**: Use existing admin API endpoints
- **Volunteer Management**: Share volunteer data
- **Event Coordination**: Sync with mobile event creation
- **Order Processing**: Handle shop orders from mobile users

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint

## Next Steps

1. Connect to the existing Supabase backend
2. Implement authentication
3. Add real data fetching
4. Create specific page content
5. Add form components
6. Implement state management (if needed)

## Notes

This web app complements the existing React Native mobile application and provides a desktop-friendly admin interface for managing Clean Up - Give Back operations.