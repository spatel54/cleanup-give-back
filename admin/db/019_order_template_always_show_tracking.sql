-- Per explicit request: always show the tracking number / carrier lines in the
-- order-tracking email, even when there's no value yet — previously they were
-- hidden via {{#if}} when empty. The app now fills in the literal placeholder
-- "[blank]" for either field when it has no real value, so this row can drop the
-- conditionals entirely and just always reference {{tracking_number}}/{{carrier}}.

UPDATE public.email_templates
SET
  body_html = '<p>Hi {{volunteer_name}},</p><p>Good news — your Clean Up Give Back order just shipped! It''s on its way to you now.</p><p>Tracking number: {{tracking_number}}</p><p>Carrier: {{carrier}}</p><p>Thanks so much for being part of our community — we hope you love your gear.</p><p>Warmly,<br/>The Clean Up Give Back Team</p>',
  updated_at = now()
WHERE template_type = 'shipped';
