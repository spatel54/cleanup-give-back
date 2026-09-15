/** Canonical shop catalog — matches mobile `/shop` pricing. Client-safe (no server imports). */

export const SHOP_ITEM_CATALOG = [
  {
    id: 'cleanup-kit',
    label: 'Trash Cleanup Kit',
    chartLabel: 'Kit',
    unitCents: 2999,
    match: [/clean\s*up\s*kit/i, /cleanup[- ]?kit/i],
  },
  {
    id: 'tote-bags',
    label: 'Tote Bags',
    chartLabel: 'Tote',
    unitCents: 300,
    match: [/tote/i],
  },
  {
    id: 'trash-grabber',
    label: 'Trash Grabber',
    chartLabel: 'Grabber',
    unitCents: 2399,
    match: [/grabber/i],
  },
  {
    id: 'adult-safety-vest',
    label: 'Adult Safety Vest',
    chartLabel: 'Adult vest',
    unitCents: 1299,
    match: [/adult.*vest/i, /vest.*adult/i],
  },
  {
    id: 'child-safety-vest',
    label: 'Child Safety Vest',
    chartLabel: 'Child vest',
    unitCents: 999,
    match: [/child.*vest/i, /vest.*child/i, /kid.*vest/i],
  },
] as const;

export type ShopItemId = (typeof SHOP_ITEM_CATALOG)[number]['id'];

export type ShopItemBreakdownRow = {
  id: ShopItemId;
  label: string;
  unitCents: number;
  qtySold: number;
  revenueCents: number;
  /** Share of catalog-item revenue (0–100). */
  sharePct: number;
  /** 1 = most units sold. */
  rankByQty: number;
};

export type ShopItemBreakdown = {
  rows: ShopItemBreakdownRow[];
  totalQty: number;
  totalRevenueCents: number;
  mostBought: ShopItemBreakdownRow | null;
  leastBought: ShopItemBreakdownRow | null;
  fromDb: boolean;
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
