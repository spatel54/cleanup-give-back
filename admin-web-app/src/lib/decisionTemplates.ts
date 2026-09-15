/**
 * Reusable decline reasons and admin-note snippets, tied to common evidence problems.
 * Hardcoded (not DB-backed) - picking a template only pre-fills an editable text field,
 * it never bypasses the free-text `decline_reason`/`admin_notes` columns.
 */

export type DecisionTemplate = {
  id: string;
  label: string;
  text: string;
};

export const DECLINE_REASON_TEMPLATES: DecisionTemplate[] = [
  {
    id: 'weak-photos',
    label: 'Weak photos',
    text: 'Photos submitted do not clearly show cleanup activity or before/after progress.',
  },
  {
    id: 'route-mismatch',
    label: 'Route mismatch',
    text: 'GPS route does not match the reported cleanup location.',
  },
  {
    id: 'missed-checkpoint',
    label: 'Missed checkpoint',
    text: 'One or more required checkpoints were not logged during the session.',
  },
  {
    id: 'duplicate-photos',
    label: 'Duplicate/reused photos',
    text: 'Photos appear to be duplicated or reused from a prior session.',
  },
  {
    id: 'hours-mismatch',
    label: 'Hours don’t match activity',
    text: 'Logged duration is inconsistent with the reported activity and distance.',
  },
  {
    id: 'incomplete-session',
    label: 'Incomplete session',
    text: 'Session was ended early and does not meet the minimum activity requirement.',
  },
];

export const ADMIN_NOTE_SNIPPETS: DecisionTemplate[] = [
  {
    id: 'hours-adjusted',
    label: 'Hours adjusted',
    text: 'Hours adjusted to reflect actual verified activity time.',
  },
  {
    id: 'followed-up',
    label: 'Followed up with volunteer',
    text: 'Followed up with volunteer for clarification before deciding.',
  },
  {
    id: 'pattern-flag',
    label: 'Flag for pattern review',
    text: 'Flagging for pattern review - see recent activity history.',
  },
  {
    id: 'evidence-borderline',
    label: 'Evidence borderline, approved',
    text: 'Evidence was borderline but approved based on session history and context.',
  },
];
