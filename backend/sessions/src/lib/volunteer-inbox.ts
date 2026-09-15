import { getServiceSupabase } from '../letterhead/supabaseAdmin.js';

function isPreferencesRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isShopOrdersInboxEnabled(userMetadata: Record<string, unknown> | undefined): boolean {
  const prefs = userMetadata?.notification_preferences;
  if (!isPreferencesRecord(prefs)) {
    return true;
  }
  return prefs.shopOrders !== false;
}

async function sendExpoPush(
  pushToken: string,
  message: { title: string; body: string; data?: Record<string, unknown> },
): Promise<void> {
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
    console.error('[volunteer-inbox] Expo push failed:', await response.text());
  }
}

/** Writes an order_update inbox row + Expo push. Independent of Resend. */
export async function deliverOrderPlacedInboxAndPush(
  userId: string,
  orderId: string,
): Promise<void> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      console.warn('[volunteer-inbox] user not found for order placed:', userId, error?.message);
      return;
    }

    const user = data.user;
    if (!isShopOrdersInboxEnabled(user.user_metadata)) {
      return;
    }

    const title = 'Order confirmed';
    const body = 'Thanks for your order. Details are in Order History.';
    const { data: existing } = await supabase
      .from('volunteer_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .eq('type', 'order_update')
      .eq('title', title)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      return;
    }

    const { data: row, error: insertError } = await supabase
      .from('volunteer_notifications')
      .insert({
        user_id: userId,
        type: 'order_update',
        title,
        body,
        order_id: orderId,
      })
      .select('id, created_at')
      .single();
    if (insertError) {
      console.error('[volunteer-inbox] insert failed:', insertError.message);
    }

    const pushToken =
      typeof user.user_metadata?.push_token === 'string' ? user.user_metadata.push_token : null;
    if (!pushToken) {
      return;
    }
    await sendExpoPush(pushToken, {
      title,
      body,
      data: {
        notificationId: row?.id,
        createdAt: typeof row?.created_at === 'string' ? row.created_at : undefined,
        type: 'order_update',
        orderId,
      },
    });
  } catch (err) {
    console.warn('[volunteer-inbox] order placed delivery skipped:', err);
  }
}
