-- Volunteer in-app inbox: one row per volunteer-visible notice
-- (session approve/decline, hours adjusted, hours reminder, later order/event).
-- Inserts come from the admin service role (`insertVolunteerNotification` in
-- admin-web-app/src/lib/notify.ts). Volunteers read their own rows and may
-- only set `read_at`. Service role bypasses RLS for inserts.

CREATE TABLE IF NOT EXISTS public.volunteer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions ON DELETE SET NULL,
  order_id uuid REFERENCES public.shop_orders ON DELETE SET NULL,
  type text NOT NULL
    CHECK (type IN (
      'session_approved',
      'session_declined',
      'hours_adjusted',
      'status_updated',
      'order_update',
      'event',
      'hours_reminder'
    )),
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS volunteer_notifications_user_created_idx
  ON public.volunteer_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS volunteer_notifications_user_unread_idx
  ON public.volunteer_notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.volunteer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volunteer_select_own_notifications" ON public.volunteer_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Volunteers may update their own rows; clients only set `read_at`.
CREATE POLICY "volunteer_update_own_notifications" ON public.volunteer_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_full_access_volunteer_notifications" ON public.volunteer_notifications
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
