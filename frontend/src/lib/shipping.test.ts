import { CLEANUP_KIT_PRICE, TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import type { CartLineItem } from '@/features/figma-screens/mocks/cart';
import { computeShippingFee, productSubtotalForShipping, shippingFeeLabel } from '@/lib/shipping';

function item(
  id: string,
  unitPrice: number,
  quantity = 1,
): CartLineItem {
  return {
    id,
    name: id,
    description: '',
    unitPrice,
    quantity,
    image: 0,
  };
}

describe('computeShippingFee', () => {
  it('charges 25% of paid product subtotal for USPS', () => {
    const items = [item('tote-bags', 3), item('trash-grabber', 23.99)];
    expect(productSubtotalForShipping(items)).toBeCloseTo(26.99);
    expect(computeShippingFee(items, 'usps_ship')).toBe(6.75);
  });

  it('includes the paid shop cleanup kit as a product', () => {
    expect(computeShippingFee([item('cleanup-kit', CLEANUP_KIT_PRICE)], 'usps_ship')).toBe(12.5);
  });

  it('ignores the free cleanup kit and tracker access', () => {
    const items = [
      item('tracker-access', TRACKER_ACCESS_PRICE),
      item('cleanup-kit', 0),
      item('tote-bags', 3),
    ];
    expect(productSubtotalForShipping(items)).toBe(3);
    expect(computeShippingFee(items, 'usps_ship')).toBe(0.75);
  });

  it('is free when only the free kit is in the cart', () => {
    expect(computeShippingFee([item('cleanup-kit', 0)], 'usps_ship')).toBe(0);
    expect(shippingFeeLabel(0)).toBe('FREE');
  });

  it('is free for office pickup', () => {
    expect(computeShippingFee([item('tote-bags', 3)], 'office_pickup')).toBe(0);
  });
});
