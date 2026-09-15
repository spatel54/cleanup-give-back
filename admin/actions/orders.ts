'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { NAV_BADGES_TAG } from '@/lib/nav-badges';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return {
      id: 'bypass-admin',
      user_metadata: { role: 'admin' },
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function updateOrderFulfillment({
  orderId,
  status,
  trackingNumber,
  carrier,
}: {
  orderId: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
}) {
  if (!isUuid(orderId)) {
    throw new Error(
      `Cannot update mock order "${orderId}". Order fulfillment requires live shop_orders rows (UUID).`
    );
  }

  const user = await getAdminUser();
  const supabase = await createServiceClient();

  // `delivered` is treated as `shipped` — keep a single post-dispatch status.
  const normalizedStatus = status === 'delivered' ? 'shipped' : status;

  const { data: before, error: fetchError } = await supabase
    .from('shop_orders')
    .select('status, tracking_number, carrier')
    .eq('id', orderId)
    .single();

  if (fetchError || !before) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const update: Record<string, unknown> = { status: normalizedStatus };
  if (trackingNumber !== undefined) update.tracking_number = trackingNumber?.trim() || null;
  if (carrier !== undefined) update.carrier = carrier?.trim() || null;

  const { error } = await supabase.from('shop_orders').update(update).eq('id', orderId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated order fulfillment',
    targetTable: 'shop_orders',
    targetId: orderId,
    beforeValue: before,
    afterValue: update,
  });

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  revalidateTag(NAV_BADGES_TAG);
}
