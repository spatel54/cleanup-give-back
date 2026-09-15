-- Scheduled ad-hoc emails from the admin Compose flow, plus CC/BCC on email_log.
-- Queue lives in Supabase; Vercel cron (`/api/cron/send-scheduled-emails`) claims
-- due `pending` rows and sends via Resend at delivery time (signed attachment
-- URLs are minted then, not at schedule time).

CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  to_email text NOT NULL,
  cc_emails text[] NOT NULL DEFAULT '{}',
  bcc_emails text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL,
  body_html text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  resend_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX IF NOT EXISTS scheduled_emails_status_for_idx
  ON public.scheduled_emails (status, scheduled_for);

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_scheduled_emails" ON public.scheduled_emails;
CREATE POLICY "admin_full_access_scheduled_emails" ON public.scheduled_emails
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE public.email_log
  ADD COLUMN IF NOT EXISTS cc_emails text[],
  ADD COLUMN IF NOT EXISTS bcc_emails text[];
