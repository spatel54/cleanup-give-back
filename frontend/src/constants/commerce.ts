/** One-time fee for unlimited tracking access. The physical cleanup kit is
 *  always included; shipping is free on this bundle. */
export const TRACKER_ACCESS_PRICE = 59.99;

/** Standalone shop kit (not the tracker bundle). Shipping is charged on USPS. */
export const CLEANUP_KIT_PRICE = 49.99;

/** USPS shipping as a fraction of paid product-item subtotal (not donations,
 *  tax, tracker access, or the free cleanup kit). */
export const PRODUCT_SHIPPING_RATE = 0.25;

/** Product id for the cleanup kit line item. */
export const CLEANUP_KIT_PRODUCT_ID = 'cleanup-kit';

/** Line id for the tracker-access fee (not a shippable shop product). */
export const TRACKER_ACCESS_PRODUCT_ID = 'tracker-access';
