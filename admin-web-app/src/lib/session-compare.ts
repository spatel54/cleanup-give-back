/** Minimal session fields needed for the side-by-side comparison view. */
import { createDataClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, getVolunteerName } from '@/lib/volunteers';

export type CompareSession = {
  id: string;
  userId: string;
  volunteerName: string;
  activity: string | null;
  status: string;
  startedAt: string | null;
  durationSeconds: number | null;
  adjustedHours: number | null;
  distanceMiles: number | null;
  adminNotes: string | null;
  declineReason: string | null;
};

export async function loadSessionsForCompare(ids: string[]): Promise<CompareSession[]> {
  const supabase = await createDataClient();
  const [{ data: rows }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select(
        'id, user_id, activity, status, started_at, duration_seconds, adjusted_hours, distance_miles, admin_notes, decline_reason',
      )
      .in('id', ids),
    getVolunteerDirectory(),
  ]);

  return (rows ?? []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    volunteerName: getVolunteerName(directory, s.user_id),
    activity: s.activity,
    status: s.status,
    startedAt: s.started_at,
    durationSeconds: s.duration_seconds,
    adjustedHours: s.adjusted_hours,
    distanceMiles: s.distance_miles,
    adminNotes: s.admin_notes,
    declineReason: s.decline_reason,
  }));
}
