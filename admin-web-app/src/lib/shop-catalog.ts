/** Canonical shop catalog - matches mobile `/shop` pricing. */

export const SHOP_ITEM_CATALOG = [
  { id: 'cleanup-kit', label: 'Trash Cleanup Kit', chartLabel: 'Kit', unitCents: 4999 },
  { id: 'tote-bags', label: 'Tote Bags', chartLabel: 'Tote', unitCents: 300 },
  { id: 'trash-grabber', label: 'Trash Grabber', chartLabel: 'Grabber', unitCents: 2399 },
  { id: 'adult-safety-vest', label: 'Adult Safety Vest', chartLabel: 'Adult vest', unitCents: 1299 },
  { id: 'child-safety-vest', label: 'Child Safety Vest', chartLabel: 'Child vest', unitCents: 999 },
] as const;

export type ShopItemId = (typeof SHOP_ITEM_CATALOG)[number]['id'];

export type ShopItemBreakdownRow = {
  id: ShopItemId;
  label: string;
  unitCents: number;
  qtySold: number;
  revenueCents: number;
  sharePct: number;
  rankByQty: number;
  /** This calendar month's revenue for MoM share trend. */
  currentMonthRevenueCents?: number | null;
  /** This calendar month's share of shop revenue (0–100). */
  currentMonthSharePct?: number | null;
  /** Prior calendar-month revenue for MoM trend. */
  priorRevenueCents?: number | null;
  /** Prior calendar-month share of shop revenue (0–100). */
  priorSharePct?: number | null;
};

export type ShopItemBreakdown = {
  rows: ShopItemBreakdownRow[];
  totalQty: number;
  totalRevenueCents: number;
  mostBought: ShopItemBreakdownRow | null;
  leastBought: ShopItemBreakdownRow | null;
  fromDb: boolean;
  /** This calendar month's shop revenue (cents) for the Revenue share card trend. */
  currentMonthRevenueCents?: number | null;
  /** Prior calendar month's shop revenue (cents). */
  priorMonthRevenueCents?: number | null;
};

const ITEM_BAR_COLORS: Record<ShopItemId, string> = {
  'cleanup-kit': '#007536',
  'tote-bags': '#2F80ED',
  'trash-grabber': '#fcab29',
  'adult-safety-vest': '#1565c0',
  'child-safety-vest': '#4a9e6e',
};

export function shopItemBarColor(id: ShopItemId): string {
  return ITEM_BAR_COLORS[id];
}

/** Deterministic mock sales mix for Payments shop-item breakdown. */
export function buildMockShopItemBreakdown(now = new Date()): ShopItemBreakdown {
  const seed = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const baseQty: Record<ShopItemId, number> = {
    'cleanup-kit': 18 + (seed % 5),
    'tote-bags': 42 + (seed % 7),
    'trash-grabber': 11 + (seed % 4),
    'adult-safety-vest': 15 + (seed % 3),
    'child-safety-vest': 8 + (seed % 3),
  };
  /** Soft MoM shift so the Revenue share card can show deltas in sample mode. */
  const priorQty: Record<ShopItemId, number> = {
    'cleanup-kit': Math.max(0, baseQty['cleanup-kit'] - 2 - (seed % 2)),
    'tote-bags': Math.max(0, baseQty['tote-bags'] - 5 + (seed % 3)),
    'trash-grabber': Math.max(0, baseQty['trash-grabber'] + 1),
    'adult-safety-vest': Math.max(0, baseQty['adult-safety-vest'] - 1),
    'child-safety-vest': Math.max(0, baseQty['child-safety-vest'] + (seed % 2)),
  };

  const totalRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + baseQty[p.id] * p.unitCents,
    0,
  );
  const totalQty = SHOP_ITEM_CATALOG.reduce((sum, p) => sum + baseQty[p.id], 0);
  const priorMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + priorQty[p.id] * p.unitCents,
    0,
  );
  /** Sample “this month” qty ≈ slightly shifted mix so MoM share deltas show up. */
  const currentQty: Record<ShopItemId, number> = {
    'cleanup-kit': Math.max(0, Math.round(baseQty['cleanup-kit'] * 0.16) - 1),
    'tote-bags': Math.max(0, Math.round(baseQty['tote-bags'] * 0.2) + 2),
    'trash-grabber': Math.max(0, Math.round(baseQty['trash-grabber'] * 0.18)),
    'adult-safety-vest': Math.max(0, Math.round(baseQty['adult-safety-vest'] * 0.17)),
    'child-safety-vest': Math.max(0, Math.round(baseQty['child-safety-vest'] * 0.18)),
  };
  const currentMonthRevenueCents = SHOP_ITEM_CATALOG.reduce(
    (sum, p) => sum + currentQty[p.id] * p.unitCents,
    0,
  );

  const rows: ShopItemBreakdownRow[] = SHOP_ITEM_CATALOG.map((p) => {
    const qtySold = baseQty[p.id];
    const revenueCents = qtySold * p.unitCents;
    const priorRevenueCents = priorQty[p.id] * p.unitCents;
    const monthRevenueCents = currentQty[p.id] * p.unitCents;
    return {
      id: p.id,
      label: p.label,
      unitCents: p.unitCents,
      qtySold,
      revenueCents,
      sharePct: totalRevenueCents > 0 ? Math.round((revenueCents / totalRevenueCents) * 100) : 0,
      rankByQty: 0,
      currentMonthRevenueCents: monthRevenueCents,
      currentMonthSharePct:
        currentMonthRevenueCents > 0
          ? Math.round((monthRevenueCents / currentMonthRevenueCents) * 100)
          : 0,
      priorRevenueCents,
      priorSharePct:
        priorMonthRevenueCents > 0
          ? Math.round((priorRevenueCents / priorMonthRevenueCents) * 100)
          : 0,
    };
  }).sort((a, b) => {
    if (b.qtySold !== a.qtySold) return b.qtySold - a.qtySold;
    return b.revenueCents - a.revenueCents;
  });

  rows.forEach((row, i) => {
    row.rankByQty = i + 1;
  });

  const withSales = rows.filter((r) => r.qtySold > 0);
  return {
    rows,
    totalQty,
    totalRevenueCents,
    mostBought: withSales[0] ?? null,
    leastBought: withSales.length > 0 ? withSales[withSales.length - 1]! : null,
    fromDb: false,
    currentMonthRevenueCents,
    priorMonthRevenueCents,
  };
}
