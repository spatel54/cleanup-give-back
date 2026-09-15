-- Figma order emails (`1311:359`): add `order_placed` template type and keep
-- `shipped` subject in sync with the code-owned HTML builder.
-- Body HTML for both types is rendered by `buildOrderEmailHtml` at send time
-- (admin-web-app/src/lib/order-email-html.ts) — the Emails-tab sanitizer
-- cannot store table/img layouts, so these stay code-owned.

ALTER TABLE public.email_log DROP CONSTRAINT IF EXISTS email_log_template_type_check;
ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_template_type_check;

ALTER TABLE public.email_templates
  ADD CONSTRAINT email_templates_template_type_check
  CHECK (template_type IS NULL OR template_type IN (
    'approved',
    'declined',
    'shipped',
    'event_registration',
    'hours_reminder',
    'order_placed'
  ));

ALTER TABLE public.email_log
  ADD CONSTRAINT email_log_template_type_check
  CHECK (template_type IN (
    'approved',
    'declined',
    'shipped',
    'event_registration',
    'at_risk_nudge',
    'hours_reminder',
    'order_placed',
    'other'
  ));

INSERT INTO public.email_templates (template_type, name, subject, body_html, is_system)
SELECT
  'order_placed',
  'Order placed',
  'Thank you for your order!',
  '<!-- Rendered by buildOrderEmailHtml (variant: placed). Do not edit in the Emails tab. -->',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE template_type = 'order_placed');

UPDATE public.email_templates
SET
  name = 'Order tracking',
  subject = 'Your order is on its way!',
  body_html = '<!-- Rendered by buildOrderEmailHtml (variant: shipped). Do not edit in the Emails tab. -->',
  updated_at = now()
WHERE template_type = 'shipped';
