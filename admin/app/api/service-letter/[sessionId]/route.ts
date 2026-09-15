import { NextResponse } from 'next/server';

import { getAdminApiKey, getSessionsApiUrl } from '@/lib/sessionsApiConfig';
import { assertAdminRequest } from '@/lib/assertAdmin';
import { markLetterheadGenerated } from '@/actions/sessions';

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
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

  const { sessionId } = await context.params;
  const upstream = await fetch(`${apiUrl}/sessions/${sessionId}/service-letter.pdf`, {
    headers: { 'x-admin-key': adminKey },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json({ error: text || 'PDF generation failed' }, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();
  const disposition =
    upstream.headers.get('Content-Disposition') ??
    `attachment; filename="CGB-Service-Letter-${sessionId}.pdf"`;

  // Stamp letterhead generation - soft fail
  try {
    await markLetterheadGenerated(sessionId);
  } catch (err) {
    console.error(`Failed to mark letterhead generated for session ${sessionId}:`, err);
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
    },
  });
}
