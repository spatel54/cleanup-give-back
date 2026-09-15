/**
 * Shop orders integration with Supabase database.
 * Handles creating and managing shop orders from the mobile checkout flow.
 */

import { supabase, getUserId } from './supabase';
import type { CartLineItem, CartDonationAmount } from '@/features/figma-screens/mocks/cart';

export type FulfillmentMethod = 'usps_ship' | 'office_pickup' | 'local_dropoff';

export type ShippingInfo = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type OrderCreateRequest = {
  items: CartLineItem[];
  donation: CartDonationAmount | null;
  shipping: ShippingInfo | null;
  tax: number;
  shippingFee?: number;
  fulfillmentMethod: FulfillmentMethod;
  includesKit: boolean;
};

export type OrderCreateResult = {
  orderId: string;
  success: true;
} | {
  success: false;
  error: string;
};

export type ShopOrderRow = {
  id: string;
  user_id: string | null;
  items: unknown;
  total_cents: number;
  status: string;
  fulfillment_method: FulfillmentMethod;
  includes_kit: boolean;
  shipping_address: unknown;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
  payment_reference?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_method_label?: string | null;
};

export function normalizeFulfillmentMethod(
  value: string | null | undefined,
): FulfillmentMethod {
  if (value === 'office_pickup' || value === 'local_dropoff' || value === 'usps_ship') {
    return value;
  }
  return 'usps_ship';
}

export const RECEIVING_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  usps_ship: 'USPS ship',
  office_pickup: 'Office pickup',
  local_dropoff: 'Local drop-off',
};

export function carrierTrackingUrl(
  carrier: string | null | undefined,
  tracking: string | null | undefined,
): string | null {
  if (!carrier || !tracking) return null;
  const c = carrier.toLowerCase();
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${tracking}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  return null;
}

/**
 * Creates a new shop order in the database.
 * This will be called when the user taps "Place Order" in the checkout flow.
 */
export async function createShopOrder(request: OrderCreateRequest): Promise<OrderCreateResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Database not configured'
      };
    }

    // Get the current user ID (anonymous auth)
    const userId = await getUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Unable to identify user'
      };
    }

    // Transform cart items to database format
    const itemsJson = request.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      qty: item.quantity,
      quantity: item.quantity, // Alias for compatibility
      unitCents: Math.round(item.unitPrice * 100),
      unit_cents: Math.round(item.unitPrice * 100), // Alias for compatibility
    }));

    // Add donation as a line item if present
    if (request.donation && typeof request.donation === 'number') {
      itemsJson.push({
        id: 'donation',
        name: 'Donation',
        description: 'Support our cleanup efforts',
        qty: 1,
        quantity: 1,
        unitCents: request.donation * 100,
        unit_cents: request.donation * 100,
      });
    }

    // Calculate total in cents
    const subtotalCents = request.items.reduce((sum, item) =>
      sum + Math.round(item.unitPrice * item.quantity * 100), 0
    );
    const donationCents = (typeof request.donation === 'number') ? request.donation * 100 : 0;
    const taxCents = Math.round(request.tax * 100);
    const shippingCents = Math.round((request.shippingFee ?? 0) * 100);
    const totalCents = subtotalCents + donationCents + taxCents + shippingCents;

    const fulfillmentMethod = normalizeFulfillmentMethod(request.fulfillmentMethod);
    const shipping = request.shipping;
    const shippingAddress =
      (fulfillmentMethod === 'usps_ship' || fulfillmentMethod === 'local_dropoff') && shipping
        ? {
            name: shipping.fullName.trim() || null,
            line1: shipping.street,
            line2: null,
            city: shipping.city,
            state: shipping.state,
            postalCode: shipping.zip,
            postal_code: shipping.zip,
            zip: shipping.zip,
            country: 'US',
            phone: null,
          }
        : null;

    const { data, error } = await supabase
      .from('shop_orders')
      .insert({
        user_id: userId,
        items: itemsJson,
        total_cents: totalCents,
        status: 'pending',
        fulfillment_method: fulfillmentMethod,
        includes_kit: request.includesKit,
        shipping_address: shippingAddress,
        tracking_number: null,
        carrier: null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[shopOrders] Failed to create order:', error);
      return {
        success: false,
        error: `Failed to create order: ${error.message}`
      };
    }

    if (!data?.id) {
      return {
        success: false,
        error: 'Order created but no ID returned'
      };
    }

    console.log('[shopOrders] Order created successfully:', data.id);
    return {
      success: true,
      orderId: data.id
    };

  } catch (error) {
    console.error('[shopOrders] Unexpected error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    };
  }
}

/**
 * Get orders for the current user (for order history, etc.)
 */
export async function getUserOrders(): Promise<{
  success: boolean;
  error: string | null;
  orders: ShopOrderRow[];
}> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured', orders: [] };
    }

    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'Unable to identify user', orders: [] };
    }

    const { data, error } = await supabase
      .from('shop_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[shopOrders] Failed to fetch orders:', error);
      return { success: false, error: error.message, orders: [] };
    }

    const orders = ((data ?? []) as ShopOrderRow[]).map((row) => ({
      ...row,
      fulfillment_method: normalizeFulfillmentMethod(row.fulfillment_method),
      includes_kit: row.includes_kit !== false,
    }));

    return { success: true, error: null, orders };

  } catch (error) {
    console.error('[shopOrders] Unexpected error fetching orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      orders: [],
    };
  }
}

export async function getOrderById(orderId: string): Promise<{
  success: boolean;
  error: string | null;
  order: ShopOrderRow | null;
}> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured', order: null };
    }

    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'Unable to identify user', order: null };
    }

    const { data, error } = await supabase
      .from('shop_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[shopOrders] Failed to fetch order:', error);
      return { success: false, error: error.message, order: null };
    }

    if (!data) {
      return { success: true, error: null, order: null };
    }

    const row = data as ShopOrderRow;
    return {
      success: true,
      error: null,
      order: {
        ...row,
        fulfillment_method: normalizeFulfillmentMethod(row.fulfillment_method),
        includes_kit: row.includes_kit !== false,
      },
    };
  } catch (error) {
    console.error('[shopOrders] Unexpected error fetching order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      order: null,
    };
  }
}
