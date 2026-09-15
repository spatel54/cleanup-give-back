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

  const { data: users } = await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      email,
      created_at,
      court_ordered,
      court_required_hours,
      volunteer_sessions (
        status,
        duration_seconds,
        adjusted_hours,
        started_at
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (!users) {
    return new NextResponse('No data', { status: 500 });
  }

  const rows = users.map((u: any) => {
    const name = u.full_name ?? 'Unknown';
    const email = u.email ?? '';
    const joinedAt = new Date(u.created_at).toLocaleDateString('en-US');
    const courtOrdered = u.court_ordered ? 'Yes' : 'No';
    const requiredHours = u.court_required_hours ?? '';

    const sessions = u.volunteer_sessions ?? [];
    const approvedSessions = sessions.filter((s: any) => s.status === 'approved');
    const totalHours = approvedSessions.reduce(
      (sum: number, s: any) => sum + computedHours(s.duration_seconds, s.adjusted_hours),
      0,
    );
    const lastActive =
      sessions.length > 0
        ? new Date(
            Math.max(
              ...sessions.map((s: any) => new Date(s.started_at).getTime()).filter((t: number) => !isNaN(t)),
            ),
          ).toLocaleDateString('en-US')
        : 'Never';

    return [name, email, joinedAt, sessions.length, totalHours.toFixed(1), courtOrdered, requiredHours, lastActive].join(
      ',',
    );
  });

  const csv = [
    'Name,Email,Joined,Total Sessions,Total Hours,Court Ordered,Required Hours,Last Active',
    ...rows,
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
