-- Bug fix: the template renderer (email-template-render.ts's renderTemplate) doesn't
-- support nested {{#if}} blocks — {{#if carrier}} was nested inside {{#if
-- tracking_number}}, so its regex-based parser matched the closing {{/if}} of the
-- INNER block as the end of the OUTER block, leaving a stray literal "{{/if}}" in
-- every sent order-tracking email. Fixed by making the two conditionals sequential
-- instead of nested.

UPDATE public.email_templates
SET
  body_html = '<p>Hi {{volunteer_name}},</p><p>Good news — your Clean Up Give Back order just shipped! It''s on its way to you now.</p>{{#if tracking_number}}<p>Tracking: {{tracking_number}}</p>{{/if}}{{#if carrier}}<p>Carrier: {{carrier}}</p>{{/if}}<p>Thanks so much for being part of our community — we hope you love your gear.</p><p>Warmly,<br/>The Clean Up Give Back Team</p>',
  updated_at = now()
WHERE template_type = 'shipped';
