-- Figma hours-reminder email (`1311:432`): body HTML is rendered by
-- `buildHoursReminderEmailHtml` at send time
-- (admin-web-app/src/lib/hours-reminder-email-html.ts) — the Emails-tab
-- sanitizer cannot store table/img layouts, so this stays code-owned.
-- Subject stays the volunteer-facing line from 017.

UPDATE public.email_templates
SET
  name = 'Hours reminder',
  subject = 'Missing you at Clean Up Give Back!',
  body_html = '<!-- Rendered by buildHoursReminderEmailHtml. Do not edit in the Emails tab. -->',
  updated_at = now()
WHERE template_type = 'hours_reminder';
