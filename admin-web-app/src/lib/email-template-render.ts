/**
 * Pure template constants + the `{{var}}`/`{{#if var}}` renderer - no server-only
 * imports, so this is safe to use from both server actions and the client-side
 * editor's live preview pane.
 */
export type EmailTemplateType =
  | 'approved'
  | 'declined'
  | 'shipped'
  | 'event_registration'
  | 'hours_reminder'
  | 'order_placed';

export const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = [
  'approved',
  'declined',
  'shipped',
  'event_registration',
  'hours_reminder',
  'order_placed',
];

/** Templates surfaced in the Emails tab's template list/editor - everything else in
 * `EMAIL_TEMPLATE_TYPES` still sends automatically (session approve/decline, event
 * registration, order placed/shipped), it's just not user-facing as an editable
 * template there.
 *
 * `shipped`, `order_placed`, and `hours_reminder` are deliberately excluded:
 * they use branded table-based layouts (`order-email-html.ts`,
 * `hours-reminder-email-html.ts`), and the Emails tab's WYSIWYG editor
 * saves through `sanitizeEmailHtml`, which strips `table`/`tr`/`td` and `img`
 * style/width/height attributes. Editing and saving them there would silently
 * flatten the branding to plain paragraphs on the next send. */
export const EMAIL_TAB_TEMPLATE_TYPES: EmailTemplateType[] = [];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  approved: 'Session approved',
  declined: 'Session declined',
  shipped: 'Order tracking',
  event_registration: 'Event registration',
  hours_reminder: 'Hours reminder',
  order_placed: 'Order placed',
};

/** Documented placeholders per template, shown in the editor and used to build the preview sample. */
export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  approved: ['activity'],
  declined: ['decline_reason', 'activity'],
  shipped: ['volunteer_name', 'tracking_number', 'carrier'],
  event_registration: ['event_title', 'event_when'],
  hours_reminder: ['volunteer_name'],
  order_placed: ['volunteer_name'],
};

/** Re-export human labels - Templates UI inserts these as chips, never `{{brackets}}`. */
export { EMAIL_VARIABLE_LABELS, labelForVariable } from '@/lib/email-template-tokens';

export const EMAIL_TEMPLATE_SAMPLE_DATA: Record<EmailTemplateType, Record<string, string>> = {
  approved: { activity: 'Riverside Park Cleanup' },
  declined: { decline_reason: 'Photos submitted do not clearly show cleanup activity.', activity: 'Riverside Park Cleanup' },
  shipped: { volunteer_name: 'Volunteer Name', tracking_number: '########', carrier: 'UPS' },
  event_registration: { event_title: 'Lakefront Trail Cleanup', event_when: ' on Sat, Mar 14 · 9:00 AM' },
  hours_reminder: { volunteer_name: 'Jordan Rivera' },
  order_placed: { volunteer_name: 'Volunteer Name' },
};

export const DEFAULT_TEMPLATES: Record<EmailTemplateType, { subject: string; bodyHtml: string }> = {
  approved: {
    subject: 'Your volunteer session has been approved!',
    bodyHtml:
      '<p>Good news! Your volunteer session has been approved.</p>{{#if activity}}<p>Activity: {{activity}}</p>{{/if}}<p>Thank you for your service to the community.</p>',
  },
  declined: {
    subject: 'Update on your volunteer session',
    bodyHtml:
      '<p>We have reviewed your volunteer session and it has not been approved.</p>{{#if decline_reason}}<p>Reason: {{decline_reason}}</p>{{/if}}{{#if activity}}<p>Activity: {{activity}}</p>{{/if}}<p>If you have questions, please reach out to us.</p>',
  },
  shipped: {
    subject: 'Your order is on its way!',
    bodyHtml:
      '<!-- Rendered by buildOrderEmailHtml (variant: shipped). Do not edit in the Emails tab. -->',
  },
  order_placed: {
    subject: 'Thank you for your order!',
    bodyHtml:
      '<!-- Rendered by buildOrderEmailHtml (variant: placed). Do not edit in the Emails tab. -->',
  },
  event_registration: {
    subject: "You're registered: {{event_title}}",
    bodyHtml:
      '<p>Thanks for registering with Clean Up Give Back.</p><p>Event: {{event_title}}{{event_when}}</p><p>We look forward to seeing you there.</p>',
  },
  hours_reminder: {
    subject: 'Missing you at Clean Up Give Back!',
    bodyHtml:
      '<!-- Rendered by buildHoursReminderEmailHtml. Do not edit in the Emails tab. -->',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * `{{var}}` substitution + `{{#if var}}...{{/if}}` conditional blocks.
 * Missing/falsy variables render as empty string; `{{#if}}` blocks with a
 * missing/falsy variable are dropped entirely.
 *
 * Pass `escapeHtml: true` when rendering into an HTML body - several variables
 * (event titles, volunteer display names) can originate from user-editable
 * fields, so unescaped interpolation into `bodyHtml` is an HTML-injection /
 * phishing vector. Leave it off for the plain-text subject line.
 */
export function renderTemplate(
  text: string,
  variables: Record<string, string | null | undefined>,
  options?: { escapeHtml?: boolean },
): string {
  const withConditionals = text.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_match, key: string, inner: string) =>
    variables[key] ? inner : '',
  );
  return withConditionals.replace(/{{(\w+)}}/g, (_match, key: string) => {
    const value = variables[key] ?? '';
    return options?.escapeHtml ? escapeHtml(value) : value;
  });
}
