# Clean-Up Give-Back: Design Blueprint

This document serves as the visual and structural design intent for the Clean-Up Give-Back app. No placeholders or invented concepts are included.

## 1. Product Identity
- **Product Name**: Clean-Up Give-Back
- **Tagline**: "Service tracking, simplified."
- **Core Goal**: "Automate tracking of community service hours with location and activity verification."

## 2. Terminology & Vocabulary
- **Users**: Volunteer, Court-ordered participant, Admin
- **Core Entities**: Cleanup session, Activity log, Profile, Evidence
- **Technical/Navigation**: Home, Developer (Dev-only tab)

## 3. Visual Identity
**Rule**: Make sure to use fonts and colors from the design system.

- **Primary Thematic Colors**:
  - Light Mode Header: `#E8F5E9` (Light Green)
  - Dark Mode Header: `#1B4332` (Dark Green)
- **Interactive Tints**:
  - Current default tint: `#0a7ea4` (Note: This is an Expo default blue; for cohesive branding, this should conceptually align with the green headers).
- **Typography**:
  - Primary Font Family: `SpaceMono`
- **Component Patterns**:
  - `ParallaxScrollView` (Used for heroic headers with imagery)
  - `ThemedView` & `ThemedText` (For automatic dark/light mode switching)
