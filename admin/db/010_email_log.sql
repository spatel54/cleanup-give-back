-- Volunteer communication log: one row per email send attempt, across every
-- send site (session approve/decline, event registration, at-risk nudges).
-- `status` starts as 'sent'/'failed' at send time; a Resend webhook receiver
-- (admin-web-app/src/app/api/webhooks/resend/route.ts) can later upgrade it
-- to 'delivered'/'bounced'/'complained' via `resend_message_id`, once the
-- webhook is configured in the Resend dashboard — optional, not required for
-- the log to be useful.

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  session_id uuid REFERENCES public.sessions ON DELETE SET NULL,
  template_type text NOT NULL
    CHECK (template_type IN ('approved', 'declined', 'shipped', 'event_registration', 'at_risk_nudge', 'other')),
  to_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'delivered', 'bounced', 'complained')),
  resend_message_id text,
  admin_user_id uuid,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_log_user_id_idx ON public.email_log (user_id);
CREATE INDEX IF NOT EXISTS email_log_resend_message_id_idx ON public.email_log (resend_message_id);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_email_log" ON public.email_log
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
