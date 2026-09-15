-- Court-ordered hours tracking no longer surfaces "hours remaining" anywhere —
-- the at_risk_nudge template (event-deadline nudge tied to required/completed
-- hours) is replaced by hours_reminder (nudges a court-ordered volunteer who
-- hasn't logged a session in 7-10 days, no hours-remaining math involved).
-- `shipped` keeps its template_type (avoids rewriting email_log/scheduled_emails
-- history) but is relabeled "Order tracking" in the admin UI.

-- Drop both check constraints before touching data — the new email_templates
-- constraint excludes 'at_risk_nudge', so it must not be added until after the
-- rename below, or it rejects its own not-yet-migrated row.
ALTER TABLE public.email_log DROP CONSTRAINT IF EXISTS email_log_template_type_check;
ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_template_type_check;

UPDATE public.email_templates
SET
  template_type = 'hours_reminder',
  name = 'Hours reminder',
  subject = 'A reminder to log your court-ordered hours',
  body_html = '<p>Hi {{volunteer_name}},</p><p>We haven''t seen a session from you in a little while. Open the Clean Up Give Back app when you get a chance to log your court-ordered hours.</p><p>Thanks for your service to the community.</p>',
  updated_at = now()
WHERE template_type = 'at_risk_nudge';

-- If no at_risk_nudge row existed (fresh install), seed hours_reminder directly.
INSERT INTO public.email_templates (template_type, name, subject, body_html, is_system)
SELECT
  'hours_reminder',
  'Hours reminder',
  'A reminder to log your court-ordered hours',
  '<p>Hi {{volunteer_name}},</p><p>We haven''t seen a session from you in a little while. Open the Clean Up Give Back app when you get a chance to log your court-ordered hours.</p><p>Thanks for your service to the community.</p>',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_type = 'hours_reminder');

UPDATE public.email_templates
SET name = 'Order tracking'
WHERE template_type = 'shipped';

-- email_templates now has no 'at_risk_nudge' row left, so the stricter set is safe.
ALTER TABLE public.email_templates
  ADD CONSTRAINT email_templates_template_type_check
  CHECK (template_type IS NULL OR template_type IN ('approved', 'declined', 'shipped', 'event_registration', 'hours_reminder'));

-- email_log is a historical record — old sends really were 'at_risk_nudge' and that
-- shouldn't be rewritten, so the old value stays allowed alongside the new one.
ALTER TABLE public.email_log
  ADD CONSTRAINT email_log_template_type_check
  CHECK (template_type IN ('approved', 'declined', 'shipped', 'event_registration', 'at_risk_nudge', 'hours_reminder', 'other'));
