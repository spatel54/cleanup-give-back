/**
 * Natural-language personalization chips for the template editor.
 * Storage stays mustache (`{{volunteer_name}}`); the UI never shows brackets.
 */

export const EMAIL_VARIABLE_LABELS: Record<string, string> = {
  volunteer_name: 'Volunteer name',
  activity: 'Activity',
  decline_reason: 'Decline reason',
  tracking_number: 'Tracking number',
  carrier: 'Carrier',
  event_title: 'Event title',
  event_when: 'Event date and time',
  event_address: 'Event address',
  event_maps_url: 'Directions link',
};

/** Variables Admin can insert into custom (non-system) templates. */
export const CUSTOM_TEMPLATE_INSERT_VARS = ['volunteer_name', 'activity'] as const;

export function labelForVariable(varName: string): string {
  return EMAIL_VARIABLE_LABELS[varName] ?? varName.replace(/_/g, ' ');
}

export function chipHtml(varName: string): string {
  const label = labelForVariable(varName);
  return `<span data-var="${varName}" contenteditable="false" class="email-token">${label}</span>`;
}

/** Stored mustache (+ optional #if blocks) → editor HTML with labeled chips. */
export function toEditorHtml(stored: string): string {
  const unwrapped = stored.replace(/\{\{#if \w+\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  return unwrapped.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => chipHtml(key));
}

/** Editor HTML with chips → mustache for DB / renderTemplate. */
export function fromEditorHtml(editorHtml: string): string {
  return editorHtml.replace(
    /<span[^>]*\bdata-var=["'](\w+)["'][^>]*>[\s\S]*?<\/span>/gi,
    (_m, key: string) => `{{${key}}}`,
  );
}

/** Subject editor may carry chip spans; collapse to plain mustache text. */
export function fromEditorSubject(editorHtml: string): string {
  const withMustache = fromEditorHtml(editorHtml);
  return withMustache
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
