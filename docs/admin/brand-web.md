# Web Brand Guidelines — CleanUpGiveBack Admin Portal

> **Source of truth for all values:** `docs/frontend/brand.md` and `frontend/src/constants/tokens.ts` (Figma Design System page `1:3`).  
> **This file is a web adaptation only.** Do NOT modify `docs/frontend/brand.md` or `frontend/src/constants/tokens.ts`.  
> **Scope:** `admin/` Next.js app only. The mobile app (`frontend/`) is unaffected.

---

## Color Primitives

All hex values sourced verbatim from `frontend/src/constants/tokens.ts → primitives`.

| Name | Hex | Mobile token |
|------|-----|-------------|
| `green-500` | `#009540` | `primitives.green500` |
| `green-50` | `#f7fff1` | `primitives.green50` |
| `gray-900` | `#1c1b1b` | `primitives.gray900` |
| `gray-700` | `#3e4a3d` | `primitives.gray700` |
| `gray-500` | `#6e7a6c` | `primitives.gray500` |
| `gray-300` | `#bdcaba` | `primitives.gray300` |
| `gray-200` | `#e5e2e1` | `primitives.gray200` |
| `white` | `#ffffff` | `primitives.white` |
| `cream-50` | `#fcf9f8` | `primitives.cream50` |
| `lime-500` | `#c2d832` | `primitives.lime500` |
| `surface-elevated` | `#f6f3f2` | `primitives.surfaceElevated` |
| `chip-bg` | `#f0edec` | `primitives.chipBg` |
| `amber-100` | `#ffddb5` | `primitives.amber100` |
| `amber-700` | `#835400` | `primitives.amber700` |
| `amber-500` | `#fcab29` | `primitives.amber500` |
| `red-50` | `#ffd9de` | `primitives.red50` |
| `red-600` | `#ba1a1a` | `primitives.red600` |
| `overlay-scrim` | `rgba(28,27,27,0.4)` | `colors.overlayScrim` |
| `primary-hover` | `#007d35` | Admin CTA hover (`hover:bg-primary-hover`) |
| `status-declined-hover` | `#ffc5ca` | Danger / decline button hover |

---

## CSS Custom Properties

Set in `admin/app/globals.css`. All values derived from primitives above.

```css
:root {
  /* Backgrounds */
  --color-bg-app:              #fcf9f8;   /* page canvas */
  --color-bg-surface:          #ffffff;   /* cards, inputs, list containers */
  --color-bg-surface-elevated: #f6f3f2;   /* sidebar, top bar */

  /* Text */
  --color-text-primary:        #1c1b1b;   /* default body + heading */
  --color-text-tertiary:       #3e4a3d;   /* captions, hints, metadata, nav inactive */
  --color-text-on-primary:     #ffffff;   /* text/icons on green fills */
  --color-text-on-primary-soft:#fcf9f8;   /* cream label on primary fills */

  /* Borders */
  --color-border-outline:      #bdcaba;   /* inputs, cards, table rows */
  --color-border-chip-selected:#e5e2e1;   /* selected filter chip ring */

  /* Brand — #007536 is AA-safe; keep #009540 as primary-brand only */
  --color-primary:             #007536;   /* CTAs, active nav, focus rings, links */
  --color-primary-brand:       #009540;   /* decorative brand accent (not AA text) */
  --color-primary-hover:       #007d35;   /* single CTA hover — do not invent per-button greens */
  --color-accent-lime:         #c2d832;   /* decorative accent */

  /* Status: Approved */
  --color-status-approved-bg:    #f7fff1;
  --color-status-approved-text:  #007536;
  --color-status-approved-border:#007536;

  /* Status: Pending / Under Review */
  --color-status-pending-bg:    #ffddb5;
  --color-status-pending-text:  #835400;
  --color-status-pending-border:#fcab29;

  /* Status: Declined / Not Approved */
  --color-status-declined-bg:    #ffd9de;
  --color-status-declined-text:  #ba1a1a;
  --color-status-declined-border:#ba1a1a;
  --color-status-declined-hover: #ffc5ca; /* danger / decline button hover */

  /* Elevation — structural chrome only */
  --shadow-nav-bottom: 0 -4px 5px rgba(0,0,0,0.02);  /* sidebar right edge */
  --shadow-bar-top:    0 4px 5px rgba(0,0,0,0.15);    /* top header bottom edge */

  /* Overlay */
  --color-overlay-scrim: rgba(28,27,27,0.4);

  /* Typography */
  --font-heading: var(--font-sanchez), Georgia, serif;
  --font-body:    var(--font-noto-sans), system-ui, sans-serif;
  --font-data:    var(--font-ibm-plex-sans), 'Courier New', monospace;
}
```

> **Light-mode only for v1.** No `prefers-color-scheme: dark` block.

---

## Typography

### Font Loading (`admin/app/fonts.ts`)

Same three families as the mobile app. Weights match `frontend/src/constants/tokens.ts → fontFamilies`.

```ts
import { Sanchez, Noto_Sans, IBM_Plex_Sans } from 'next/font/google';

export const sanchez = Sanchez({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-sanchez',
  display: 'swap',
});

export const notoSans = Noto_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});
```

Apply in `admin/app/layout.tsx`:

```tsx
import { sanchez, notoSans, ibmPlexSans } from './fonts';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sanchez.variable} ${notoSans.variable} ${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Text Styles

All values from `frontend/src/constants/tokens.ts → textStyles`. React Native `dp` units map 1:1 to CSS `px`.

| Style | Font family | Weight | Size | Line-height | Letter-spacing | Admin usage |
|-------|-------------|--------|------|-------------|----------------|-------------|
| `display-hero` | Sanchez | 400 | 40px | 48px | — | Page hero, empty states |
| `headline-page` | Sanchez | 400 | 28px | 36px | — | Section headings, modal titles |
| `headline-section` | Sanchez | 400 | 34px | 42px | — | Dashboard panel titles |
| `headline-detail` | Sanchez | 400 | 20px | 28px | — | Card titles, detail page headers |
| `body-default` | Noto Sans | 400 | 16px | 24px | — | Table cells, form labels, body copy |
| `body-large` | Noto Sans | 400 | 18px | 26px | — | Description blocks |
| `body-small` | Noto Sans | 400 | 14px | 20px | — | Metadata, timestamps, secondary info |
| `body-emphasis` | Noto Sans | 500 | 16px | 24px | — | Emphasized body copy |
| `body-strong` | Noto Sans | 700 | 16px | 24px | — | Bold inline emphasis |
| `label-overline` | IBM Plex Sans | 500 | 12px | 18px | 0.96px | Section overline labels |
| `label-status` | IBM Plex Sans | 500 | 12px | 16px | — | Status chips |
| `label-button` | IBM Plex Sans | 600 | 16px | 20px | — | Button labels |
| `nav-tab` | IBM Plex Sans | 600 | 12px | 18px | — | Sidebar nav labels |
| `data-stat` | IBM Plex Sans | 600 | 28px | 36px | — | KPI numbers on dashboard |

---

## Spacing Scale

From `frontend/src/constants/tokens.ts → spacing`. Mapped to Tailwind:

| Token | px | Tailwind |
|-------|----|----------|
| `xs` | 4 | `p-1` / `gap-1` |
| `sm` | 8 | `p-2` / `gap-2` |
| `md` | 16 | `p-4` / `gap-4` |
| `lg` | 24 | `p-6` / `gap-6` |
| `xl` | 32 | `p-8` / `gap-8` |
| `2xl` | 40 | `p-10` / `gap-10` |
| `3xl` | 48 | `p-12` / `gap-12` |
| `4xl` | 64 | `p-16` / `gap-16` |

Default horizontal page margin: **24px** (matches `screenPaddingHorizontal = spacing.lg`).

---

## Border Radius

From `frontend/src/constants/tokens.ts → radius`:

| Token | px | Tailwind / CSS |
|-------|----|----------------|
| `sm` | 8 | `rounded-lg` |
| `md` | 16 | `rounded-2xl` |
| `search` | 22 | `rounded-[22px]` |
| `full` | 9999 | `rounded-full` |

---

## Elevation / Shadow

Shadows are used **only for structural chrome** — same rule as the mobile app (`brand.md §Elevation`).

| Applied to | CSS / Tailwind |
|------------|----------------|
| Top header bar (bottom edge) | `shadow-bar-top` → `0 4px 5px rgba(0,0,0,0.15)` |
| Mobile/collapsed sidebar (outer edge) | `shadow-nav-bottom` → `0 -4px 5px rgba(0,0,0,0.02)` |
| Floating overlays (dropdowns, tooltips, drawers, search popovers) | `shadow-bar-top` only — never Tailwind `shadow-sm` / `shadow-md` / `shadow-lg` |
| Cards, buttons, table rows, modal dialogs, legend dots | **No shadow** — use `border: 1px solid var(--color-border-outline)` |
| Map pins / photo thumbs on maps | `drop-shadow(0 2px 3px rgba(0,0,0,0.35))` — match mobile map markers |

---

## Tailwind Config

```ts
// admin/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:             '#007536',
        'primary-brand':     '#009540',
        'bg-app':            '#fcf9f8',
        'bg-surface':        '#ffffff',
        'bg-surface-elevated':'#f6f3f2',
        'text-primary':      '#1c1b1b',
        'text-tertiary':     '#3e4a3d',
        'border-outline':    '#bdcaba',
        'accent-lime':       '#c2d832',
        status: {
          approved: { bg: '#f7fff1', text: '#007536', border: '#007536' },
          pending:  { bg: '#ffddb5', text: '#835400', border: '#fcab29' },
          declined: { bg: '#ffd9de', text: '#ba1a1a', border: '#ba1a1a' },
        },
      },
      fontFamily: {
        heading: ['var(--font-sanchez)', 'Georgia', 'serif'],
        body:    ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        data:    ["var(--font-ibm-plex-sans)", "'Courier New'", 'monospace'],
      },
      borderRadius: {
        sm:     '8px',
        md:     '16px',
        search: '22px',
      },
      spacing: {
        xs:   '4px',
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        xl:   '32px',
        '2xl':'40px',
        '3xl':'48px',
        '4xl':'64px',
      },
      boxShadow: {
        'nav-bottom': '0 -4px 5px rgba(0,0,0,0.02)',
        'bar-top':    '0 4px 5px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Copy Tone (Admin Context)

Inherits the mobile app voice — clear, encouraging, community-focused — with admin-specific adaptations:

- **Direct and action-oriented:** "Approve", "Decline", "Generate" — not "Please approve" or "Would you like to…"
- **Confirm dialogs:** positive-first button order — **[Primary action]** before **[Cancel]**
- **Errors:** name the problem and the fix — "No approved sessions in this range — adjust the dates and try again."
- **Professional tone only** — no volunteer-facing taglines, no cleanup emojis in UI chrome
- **Tagline** (if shown): *Service tracking, simplified.*

---

## Accessibility

WCAG 2.1 AA is the standard — same as the mobile app (`a11y-audit-2026-06-30.md`). Admin portal audit: [`a11y-audit-2026-07-22.md`](a11y-audit-2026-07-22.md).

### Primary green (AA-safe)

Brand `#009540` (`green-500`) fails WCAG AA for normal text / white-on-green (~3.9:1). Admin UI uses:

| Token | Hex | Use |
|-------|-----|-----|
| `--color-primary` / Tailwind `primary` | `#007536` | CTAs, links, active nav, focus rings, approved status (~4.6:1) |
| `--color-primary-brand` / Tailwind `primary-brand` | `#009540` | Brand-only accents where contrast is not required (large/decorative) |

Web-specific additions:

```css
/* Focus ring — 2px + 2px offset, AA-safe primary */
:focus-visible {
  outline: 2px solid var(--color-primary); /* #007536 */
  outline-offset: 2px;
}

/* Minimum click target */
.interactive {
  min-height: 44px;
  min-width: 44px;
}

/* Gate hover states on real pointer devices */
@media (hover: hover) and (pointer: fine) {
  .table-row:hover {
    background-color: var(--color-bg-surface-elevated);
  }
}
```

**Text contrast rules (from `brand.md §Accessibility`):**
- `#3e4a3d` (`gray-700` / `--color-text-tertiary`) is the sole de-emphasized text token — do not use `#6e7a6c` (`gray-500`) as body text; it fails AA on white
- Do **not** use `#009540` for normal-weight text on white or white text on `#009540` fills — use `#007536` instead
- All body text must meet 4.5:1 contrast against its background

---

*Web brand guidelines for `admin/` — do not modify `docs/frontend/brand.md`*
