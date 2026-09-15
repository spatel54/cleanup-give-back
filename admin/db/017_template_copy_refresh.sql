-- Warmer, more human copy for the 2 volunteer-facing templates — supersedes the
-- placeholder wording seeded in 015/016. Unconditional update (not "only if
-- missing" like 016) since this is a deliberate copy change, not a data-integrity
-- backstop; re-run safely, it's idempotent.

UPDATE public.email_templates
SET
  subject = 'Missing you at Clean Up Give Back!',
  body_html = '<p>Hi {{volunteer_name}},</p><p>We haven''t seen a cleanup session from you in a little while — no worries if life''s been busy! Whenever you get a chance, open the app to log your next session and keep your court-ordered hours moving along.</p><p>We really appreciate everything you do for the community.</p><p>Thanks,<br/>The Clean Up Give Back Team</p>',
  updated_at = now()
WHERE template_type = 'hours_reminder';

UPDATE public.email_templates
SET
  subject = 'Your order is on its way!',
  body_html = '<p>Hi {{volunteer_name}},</p><p>Good news — your Clean Up Give Back order just shipped! It''s on its way to you now.</p>{{#if tracking_number}}<p>Tracking: {{tracking_number}}{{#if carrier}} ({{carrier}}){{/if}}</p>{{/if}}<p>Thanks so much for being part of our community — we hope you love your gear.</p><p>Warmly,<br/>The Clean Up Give Back Team</p>',
  updated_at = now()
WHERE template_type = 'shipped';
