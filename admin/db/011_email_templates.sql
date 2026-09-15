-- Editable email templates. Two kinds share one table:
--   - "System" templates (`is_system = true`, one of the 5 fixed `template_type`
--     keys) back the automated sends in notify.ts/actions/events.ts/actions/orders.ts
--     /backend emails.ts. Always exist (seeded below), never deleted, `template_type`
--     stays stable so those send sites can look them up by key.
--   - "Custom" templates (`is_system = false`, `template_type` null) are freeform,
--     Admin-authored templates for the ad-hoc Compose flow — created/renamed/deleted
--     at will, matched by `id` not `template_type`.
-- `body_html` is authored via a WYSIWYG editor (admin-web-app's `RichTextEditor`),
-- not hand-written HTML. `{{variable}}` / `{{#if variable}}...{{/if}}` placeholders
-- are still supported and interpolated at send time (escaped — see
-- admin-web-app/src/lib/email-template-render.ts).

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text UNIQUE
    CHECK (template_type IS NULL OR template_type IN ('approved', 'declined', 'shipped', 'event_registration', 'at_risk_nudge')),
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_email_templates" ON public.email_templates
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

INSERT INTO public.email_templates (template_type, name, subject, body_html, is_system) VALUES
  (
    'approved',
    'Session approved',
    'Your volunteer session has been approved!',
    '<p>Good news! Your volunteer session has been approved.</p>{{#if activity}}<p>Activity: {{activity}}</p>{{/if}}<p>Thank you for your service to the community.</p>',
    true
  ),
  (
    'declined',
    'Session declined',
    'Update on your volunteer session',
    '<p>We have reviewed your volunteer session and it has not been approved.</p>{{#if decline_reason}}<p>Reason: {{decline_reason}}</p>{{/if}}{{#if activity}}<p>Activity: {{activity}}</p>{{/if}}<p>If you have questions, please reach out to us.</p>',
    true
  ),
  (
    'shipped',
    'Order shipped',
    'Your Clean Up Give Back order has shipped!',
    '<p>Hi {{volunteer_name}},</p><p>Your order has shipped{{#if tracking_number}} — tracking number: {{tracking_number}}{{/if}}{{#if carrier}} via {{carrier}}{{/if}}.</p><p>Thanks for volunteering with us.</p>',
    true
  ),
  (
    'event_registration',
    'Event registration',
    'You''re registered: {{event_title}}',
    '<p>Thanks for registering with Clean Up Give Back.</p><p>Event: {{event_title}}{{event_when}}</p><p>We look forward to seeing you there.</p>',
    true
  ),
  (
    'at_risk_nudge',
    'At-risk nudge',
    'Catch up on your court hours: {{event_title}}',
    '<p>Hi {{volunteer_name}},</p><p>You still have court-ordered hours remaining. Here''s an upcoming Clean Up Give Back event you can join:</p><p>{{event_title}}<br/>{{event_when}}{{#if event_address}}<br/>{{event_address}}{{/if}}</p>{{#if event_maps_url}}<p><a href="{{event_maps_url}}">Directions</a></p>{{/if}}<p>Open the Clean Up Give Back app to register.</p>',
    true
  )
ON CONFLICT (template_type) DO NOTHING;
