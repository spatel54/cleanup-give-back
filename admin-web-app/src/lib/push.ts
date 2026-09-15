/** Shared Expo push send - used by session-decision notifications and the hours-reminder cron. */
export interface ExpoPushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPush(pushToken: string, message: ExpoPushMessage): Promise<void> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data ?? {},
    }),
  });

  if (!response.ok) {
    console.error(`[push] Expo push failed for ${pushToken}:`, await response.text());
  }
}
