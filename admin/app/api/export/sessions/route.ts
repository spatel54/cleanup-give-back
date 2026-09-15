import { NextRequest, NextResponse } from 'next/server';
import { createDataClient } from '@/lib/supabase/server';
import { assertAdminRequest } from '@/lib/assertAdmin';
import { computedHours } from '@/lib/format';

export async function GET(request: NextRequest) {
  const admin = await assertAdminRequest();
  if (!admin) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createDataClient();

  const { data: sessions } = await supabase
    .from('volunteer_sessions')
    .select(
      `
      id,
      started_at,
      activity,
      duration_seconds,
      adjusted_hours,
      status,
      court_ordered,
      admin_notes,
      profiles!volunteer_sessions_user_id_fkey (
        full_name
      )
    `,
    )
    .order('started_at', { ascending: false });

  if (!sessions) {
    return new NextResponse('No data', { status: 500 });
  }

  const rows = sessions.map((s: any) => {
    const volunteerName = s.profiles?.full_name ?? 'Unknown';
    const date = new Date(s.started_at).toLocaleDateString('en-US');
    const activity = s.activity ?? 'Cleanup';
    const durationHours = computedHours(s.duration_seconds, s.adjusted_hours);
    const adjustedHours = s.adjusted_hours ?? '';
    const status =
      s.status === 'approved'
        ? 'Approved'
        : s.status === 'under_review'
          ? 'Under Review'
          : s.status === 'not_approved'
            ? 'Declined'
            : s.status;
    const courtOrdered = s.court_ordered ? 'Yes' : 'No';
    const adminNotes = (s.admin_notes ?? '').replace(/"/g, '""');

    return [volunteerName, s.id, date, activity, durationHours, adjustedHours, status, courtOrdered, `"${adminNotes}"`].join(
      ',',
    );
  });

  const csv = [
    'Volunteer Name,Session ID,Date,Activity,Duration (hours),Adjusted Hours,Status,Court Ordered,Admin Notes',
    ...rows,
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sessions-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
