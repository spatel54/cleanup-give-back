/** Mock payment fixtures for `/payments` until `backend/payments/` ships donations. */

export type MonthlyRevenuePoint = {
  /** Short axis label, e.g. "Feb" */
  label: string;
  /** Month key for lookups, e.g. "2026-02" */
  monthKey: string;
  donationsCents: number;
  shopCents: number;
};

/**
 * Six calendar months ending in the current month (relative to `now`).
 * Values are illustrative fixtures aligned with mock shop orders + donation history.
 */
export function buildMockMonthlyRevenue(now = new Date()): MonthlyRevenuePoint[] {
  const fixtures: Record<string, { donationsCents: number; shopCents: number }> = {
    '2026-02': { donationsCents: 12_500, shopCents: 8_997 },
    '2026-03': { donationsCents: 18_000, shopCents: 14_495 },
    '2026-04': { donationsCents: 9_500, shopCents: 11_996 },
    '2026-05': { donationsCents: 22_000, shopCents: 19_493 },
    '2026-06': { donationsCents: 15_500, shopCents: 16_994 },
    '2026-07': { donationsCents: 27_500, shopCents: 24_986 },
  };

  const points: MonthlyRevenuePoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const fixture = fixtures[monthKey] ?? {
      donationsCents: 8_000 + ((5 - i) % 4) * 2_500,
      shopCents: 6_000 + ((5 - i) % 5) * 3_000,
    };
    points.push({
      label,
      monthKey,
      donationsCents: fixture.donationsCents,
      shopCents: fixture.shopCents,
    });
  }
  return points;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
