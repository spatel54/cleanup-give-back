import { Easing, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion tokens for the Expo Go native flow — Emil Kowalski principles
 * (see `frontend/design/figma/design.md` §10), translated to Reanimated.
 *
 * - Transform + opacity only — never animate layout.
 * - Custom bezier curves, not built-in weak easings.
 * - Entrances use ease-out; on-screen movement uses ease-in-out.
 * - Never scale from 0 — entrances start at 0.9+ with opacity 0.
 * - Exit faster than enter (asymmetric timing).
 * - Respect reduced motion via `useReducedMotion()`.
 */

export const easing = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

export const durations = {
  pressFeedback: 140,
  tooltip: 160,
  dropdown: 200,
  modalEnter: 280,
  modalExit: 200,
  sheetDismiss: 360,
  mapRevealWipe: 480,
  screenEnter: 220,
  staggerStep: 50,
  coachmark: 200,
  checkmarkPop: 240,
  warningAttention: 260,
} as const;

export const pressSpring: WithSpringConfig = {
  duration: durations.pressFeedback,
  dampingRatio: 1,
};

export const modalSpring: WithSpringConfig = {
  damping: 20,
  mass: 1,
  stiffness: 220,
};

/** Bottom-sheet dismiss — slower, heavily damped so the sheet eases off-screen. */
export const sheetDismissSpring: WithSpringConfig = {
  damping: 28,
  mass: 1.05,
  stiffness: 120,
};

export const minimizeSpring: WithSpringConfig = {
  damping: 22,
  mass: 1,
  stiffness: 180,
};

export const popSpring: WithSpringConfig = {
  damping: 14,
  mass: 0.9,
  stiffness: 220,
};

export const pressScale = {
  default: 0.97,
  subtle: 0.98,
} as const;

export const enterFrom = {
  scale: 0.92,
  translateY: 8,
  opacity: 0,
} as const;

export function staggerDelay(index: number, step: number = durations.staggerStep) {
  return index * step;
}
