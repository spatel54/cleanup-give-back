-- Guarantee the "Order tracking" (shipped) template's body actually includes the
-- {{tracking_number}} token — only touches rows missing it, so any other copy
-- Admin has customized in the template editor stays untouched.

UPDATE public.email_templates
SET
  body_html = '<p>Hi {{volunteer_name}},</p><p>Your order has shipped{{#if tracking_number}} — tracking number: {{tracking_number}}{{/if}}{{#if carrier}} via {{carrier}}{{/if}}.</p><p>Thanks for volunteering with us.</p>',
  updated_at = now()
WHERE template_type = 'shipped'
  AND body_html NOT LIKE '%tracking_number%';
