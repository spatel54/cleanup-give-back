-- Volunteers may INSERT their own inbox rows so a received Expo banner can be
-- stored even if the server insert did not land. They can only write user_id =
-- auth.uid() (cannot spoof another volunteer).
-- Also add the table to Realtime so Messages updates while the app is open.

CREATE POLICY "volunteer_insert_own_notifications" ON public.volunteer_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
