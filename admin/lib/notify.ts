import { createServiceClient } from '@/lib/supabase/server';
import { getResendClient, getFromAddress } from './resend';

interface NotifyVolunteerSessionDecisionParams {
  userId: string;
  sessionId: string;
  decision: 'approved' | 'declined';
  declineReason?: string;
  activity?: string | null;
}

export async function notifyVolunteerSessionDecision({
  userId,
  sessionId,
  decision,
  declineReason,
  activity,
}: NotifyVolunteerSessionDecisionParams): Promise<void> {
  const supabase = await createServiceClient();

  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data?.user) {
    console.error(`[notify] Failed to fetch user ${userId}:`, userError);
    return;
  }

  const user = data.user;
  const email = user.email;
  const pushToken = user.user_metadata?.push_token as string | undefined;

  const subject =
    decision === 'approved'
      ? 'Your volunteer session has been approved!'
      : 'Update on your volunteer session';

  let emailBody = '';
  if (decision === 'approved') {
    emailBody = `
      <p>Good news! Your volunteer session has been approved.</p>
      ${activity ? `<p>Activity: ${activity}</p>` : ''}
      <p>Thank you for your service to the community.</p>
    `;
  } else {
    emailBody = `
      <p>We have reviewed your volunteer session and it has not been approved.</p>
      ${declineReason ? `<p>Reason: ${declineReason}</p>` : ''}
      ${activity ? `<p>Activity: ${activity}</p>` : ''}
      <p>If you have questions, please reach out to us.</p>
    `;
  }

  if (email) {
    try {
      const resend = getResendClient();
      if (resend) {
        await resend.emails.send({
          from: getFromAddress(),
          to: email,
          subject,
          html: emailBody,
        });
        console.log(`[notify] Email sent to ${email} for session ${sessionId}`);
      } else {
        console.log(`[notify] Resend not configured; skipping email to ${email}`);
      }
    } catch (err) {
      console.error(`[notify] Failed to send email to ${email}:`, err);
    }
  }

  if (pushToken) {
    try {
      const pushMessage = {
        to: pushToken,
        sound: 'default',
        title: decision === 'approved' ? 'Session Approved!' : 'Session Update',
        body:
          decision === 'approved'
            ? 'Your volunteer session has been approved.'
            : declineReason
              ? `Your session was not approved. ${declineReason}`
              : 'Your session was not approved.',
        data: { sessionId },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushMessage),
      });

      if (!response.ok) {
        console.error(
          `[notify] Expo push failed for ${pushToken}:`,
          await response.text()
        );
      } else {
        console.log(`[notify] Push notification sent to ${pushToken} for session ${sessionId}`);
      }
    } catch (err) {
      console.error(`[notify] Failed to send push notification to ${pushToken}:`, err);
    }
  }
}

interface NotifyAdminNewSessionForReviewParams {
  sessionId: string;
  volunteerName?: string;
  activity?: string;
}

export async function notifyAdminNewSessionForReview({
  sessionId,
  volunteerName,
  activity,
}: NotifyAdminNewSessionForReviewParams): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) {
    console.log('[notify] ADMIN_NOTIFY_EMAIL not set; skipping Admin notification');
    return;
  }

  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('[notify] Resend not configured; skipping Admin notification');
      return;
    }

    const subject = 'New volunteer session for review';
    const body = `
      <p>A new volunteer session is ready for review.</p>
      <p>Session ID: ${sessionId}</p>
      ${volunteerName ? `<p>Volunteer: ${volunteerName}</p>` : ''}
      ${activity ? `<p>Activity: ${activity}</p>` : ''}
      <p>Please review it in the admin dashboard.</p>
    `;

    await resend.emails.send({
      from: getFromAddress(),
      to: adminEmail,
      subject,
      html: body,
    });

    console.log(`[notify] Admin notification sent for session ${sessionId}`);
  } catch (err) {
    console.error(`[notify] Failed to send Admin notification:`, err);
  }
}
