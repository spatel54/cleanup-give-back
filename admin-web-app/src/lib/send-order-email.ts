/**
 * Load a live `shop_orders` row and send the Figma order email (placed or shipped).
 * HTML always comes from `buildOrderEmailHtml` - never from `email_templates.body_html`
 * (the Emails-tab sanitizer would flatten the table layout).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { logEmailSend } from '@/lib/email-log';
import { getTemplate } from '@/lib/email-templates';
import {
  defaultShippingLabelForFulfillment,
  ORDER_EMAIL_SUBJECTS,
  parseShopOrderAddress,
  parseShopOrderItems,
  type OrderEmailVariant,
} from '@/lib/order-email-html';
import { buildOrderEmailForSend } from '@/lib/order-email-send';
import { getFromAddress, getResendClient } from '@/lib/resend';
import { getVolunteerDirectory, isMockAddress } from '@/lib/volunteers';
import { notifyVolunteerOrderUpdate } from '@/lib/notify';

type ShopOrderRow = {
  id: string;
  user_id: string | null;
  items: unknown;
  total_cents: number | null;
  shipping_address: unknown;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  includes_kit?: boolean | null;
  fulfillment_method?: string | null;
  payment_method_label?: string | null;
};

function isGeneratedVolunteerName(name: string | null | undefined): boolean {
  return Boolean(name && /^Volunteer [0-9A-Fa-f]{8}$/.test(name.trim()));
}

export async function sendShopOrderEmail({
  supabase,
  orderId,
  variant,
  adminUserId,
}: {
  supabase: SupabaseClient;
  orderId: string;
  variant: OrderEmailVariant;
  adminUserId?: string | null;
}): Promise<void> {
  const { data: order, error } = await supabase
    .from('shop_orders')
    .select('id, user_id, items, total_cents, shipping_address, tracking_number, carrier, created_at, includes_kit, fulfillment_method, payment_method_label')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.warn('[order-email] order not found, skipping send:', orderId, error?.message);
    return;
  }

  const row = order as ShopOrderRow;
  if (!row.user_id) return;

  await notifyVolunteerOrderUpdate({
    userId: row.user_id,
    orderId: row.id,
    variant,
  });

  const directory = await getVolunteerDirectory();
  const entry = directory.get(row.user_id);
  if (!entry?.email || isMockAddress(entry.email)) return;

  const templateType = variant === 'placed' ? 'order_placed' : 'shipped';
  const template = await getTemplate(templateType);
  const volunteerName = isGeneratedVolunteerName(entry.name) ? null : entry.name;
  const items = parseShopOrderItems(row.items);
  const { html, attachments } = buildOrderEmailForSend({
    variant,
    volunteerName,
    orderId: row.id,
    createdAt: row.created_at,
    totalCents: row.total_cents,
    shippingAddress: parseShopOrderAddress(row.shipping_address),
    items,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    includesKit: row.includes_kit ?? null,
    shippingLabel: defaultShippingLabelForFulfillment(row.fulfillment_method, items),
    paymentMethod: row.payment_method_label,
  });
  const subject = template.subject?.trim() || ORDER_EMAIL_SUBJECTS[variant];

  const resend = getResendClient();
  if (!resend) return;

  const { data, error: sendError } = await resend.emails.send({
    from: getFromAddress(),
    to: entry.email,
    subject,
    html,
    attachments,
  });

  await logEmailSend(supabase, {
    userId: row.user_id,
    templateType,
    toEmail: entry.email,
    subject,
    status: sendError ? 'failed' : 'sent',
    resendMessageId: data?.id ?? null,
    adminUserId: adminUserId ?? null,
  });
}
