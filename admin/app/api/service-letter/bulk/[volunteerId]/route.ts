import { NextResponse } from 'next/server';

import { getAdminApiKey, getSessionsApiUrl } from '@/lib/sessionsApiConfig';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdminRequest } from '@/lib/assertAdmin';

export async function GET(
  request: Request,
  context: { params: Promise<{ volunteerId: string }> },
) {
  const user = await assertAdminRequest();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiUrl = getSessionsApiUrl();
  const adminKey = getAdminApiKey();
  if (!apiUrl || !adminKey) {
    return NextResponse.json({ error: 'Sessions API not configured' }, { status: 500 });
  }

  const { volunteerId } = await context.params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const serviceClient = await createServiceClient();
  let query = serviceClient
    .from('sessions')
    .select('id')
    .eq('user_id', volunteerId)
    .eq('status', 'approved')
    .order('started_at', { ascending: true });

  if (from) {
    query = query.gte('started_at', from);
  }
  if (to) {
    query = query.lte('started_at', to);
  }

  const { data: sessions, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sessionIds = (sessions ?? []).map((row) => row.id);
  if (sessionIds.length === 0) {
    return NextResponse.json(
      { error: 'No approved sessions in this range — adjust the dates and try again.' },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${apiUrl}/sessions/service-letter.pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ sessionIds }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json({ error: text || 'PDF generation failed' }, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();
  const disposition =
    upstream.headers.get('Content-Disposition') ??
    `attachment; filename="CGB-Service-Letter-bulk.pdf"`;

  // Stamp letterhead generation for all sessions - soft fail
  const now = new Date().toISOString();
  try {
    await serviceClient
      .from('sessions')
      .update({ letterhead_generated_at: now })
      .in('id', sessionIds);
  } catch (err) {
    console.error('Failed to mark bulk letterhead generated:', err);
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
    },
  });
}
