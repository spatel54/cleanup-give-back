import { Easing, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion tokens for the Session Tracking feature — Emil Kowalski's animation
 * framework (`.claude/skills/emil-design-eng`), translated to Reanimated.
 *
 * Rules encoded here (see design.md §10 for the Figma-side mirror):
 * - Transform + opacity only — never animate layout.
 * - Custom bezier curves, not the built-in weak CSS-style easings.
 * - Entrances/exits use ease-out; on-screen movement uses ease-in-out.
 * - Never scale from 0 — entrances start at 0.9+ combined with opacity 0.
 * - Exit faster than enter (asymmetric timing).
 * - Respect reduced-motion via `useReducedMotion()` (react-native-reanimated).
 */

// ─── Easing curves ──────────────────────────────────────────────────────────

export const easing = {
  /** Strong ease-out — entrances, button press release, anything appearing. */
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  /** Strong ease-in-out — on-screen movement/morphing (e.g. minimize morph). */
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** iOS-style drawer/sheet curve (Ionic Framework). */
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

// ─── Durations (ms) ─────────────────────────────────────────────────────────
// Kept under 300ms per the "UI animations should stay under 300ms" rule.
// Modal exit is intentionally faster than enter (asymmetric timing).

export const durations = {
  pressFeedback: 140,
  tooltip: 160,
  dropdown: 200,
  modalEnter: 280,
  modalExit: 200,
  screenEnter: 220,
  staggerStep: 50,
  checkmarkPop: 240,
  warningAttention: 260,
} as const;

// ─── Spring configs ─────────────────────────────────────────────────────────

/** Press feedback — no bounce, snaps back immediately on release. */
export const pressSpring: WithSpringConfig = {
  duration: durations.pressFeedback,
  dampingRatio: 1,
};

/** Photo Checkpoint modal/sheet enter — design.md: `modal=slideUp spring damping=20`. */
export const modalSpring: WithSpringConfig = {
  damping: 20,
  mass: 1,
  stiffness: 220,
};

/** Live Session ↔ MinimizedTrackerBar morph — on-screen movement, subtle settle. */
export const minimizeSpring: WithSpringConfig = {
  damping: 22,
  mass: 1,
  stiffness: 180,
};

/** Checkmark "pop" on Photo Submitted — slightly livelier, still no overshoot wobble. */
export const popSpring: WithSpringConfig = {
  damping: 14,
  mass: 0.9,
  stiffness: 220,
};

// ─── Press feedback scale ───────────────────────────────────────────────────

/** Applied via pressSpring on all Pressable components — subtle, never below 0.95. */
export const pressScale = {
  default: 0.97,
  subtle: 0.98,
} as const;

// ─── Entrance transform starting points ────────────────────────────────────
// Never animate from scale(0) — start visible-but-small, combined with opacity 0.

export const enterFrom = {
  scale: 0.92,
  translateY: 8,
  opacity: 0,
} as const;

// ─── Stagger ────────────────────────────────────────────────────────────────

/** Delay (ms) applied per item index: `index * staggerDelay(index)`. Keep 30-80ms. */
export function staggerDelay(index: number, step: number = durations.staggerStep) {
  return index * step;
}
