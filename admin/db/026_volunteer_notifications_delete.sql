-- Volunteers may delete their own inbox rows (Clear all messages).
-- Apply after 025_volunteer_notifications.sql.

CREATE POLICY "volunteer_delete_own_notifications" ON public.volunteer_notifications
  FOR DELETE
  USING (auth.uid() = user_id);
