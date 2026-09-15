/**
 * Donate / Contribute mocks — Figma `shop_donate` (`412:4` / PRD §6.20).
 * SVG icons are react-native-svg components in `DonateIcons.generated.tsx`.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const DONATE_ASSETS = {
  /** Cropped WebP (~38KB) — display is ~full-width × 140; avoid the old 685KB PNG. */
  hero: require('@/assets/figma/shop/donate/hero.webp') as number,
};

export type DonatePreset = 5 | 10 | 15;

export type DonateAmountSelection =
  | { kind: 'preset'; amount: DonatePreset }
  | { kind: 'custom'; value: string };

export const DONATE_PRESETS: DonatePreset[] = [5, 10, 15];

export const POPULAR_AMOUNT: DonatePreset = 10;

export interface DonateImpactCopy {
  amountLabel: string;
  body: string;
}

const IMPACT_BY_PRESET: Record<DonatePreset, DonateImpactCopy> = {
  5: {
    amountLabel: '$5',
    body: 'Provides reusable bags and gloves for 1 volunteer to join a neighborhood cleanup.',
  },
  10: {
    amountLabel: '$10',
    body: 'Equips 2 volunteers with heavy-duty gloves, reusable bags, and safety vests for a full weekend session.',
  },
  15: {
    amountLabel: '$15',
    body: 'Outfits 3 volunteers with gloves, bags, and vests so a full crew can cover more ground.',
  },
};

export function parseDonateAmountParam(
  raw: string | string[] | undefined,
): DonateAmountSelection {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'custom') {
    return { kind: 'custom', value: '' };
  }
  const n = Number(value);
  if (n === 5 || n === 10 || n === 15) {
    return { kind: 'preset', amount: n };
  }
  return { kind: 'preset', amount: POPULAR_AMOUNT };
}

export function getDonateImpact(selection: DonateAmountSelection): DonateImpactCopy {
  if (selection.kind === 'preset') {
    return IMPACT_BY_PRESET[selection.amount];
  }
  const parsed = Number.parseFloat(selection.value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      amountLabel: 'gift',
      body: 'Your custom gift funds cleanup supplies and community programs nationwide.',
    };
  }
  const rounded = Math.round(parsed);
  return {
    amountLabel: `$${rounded}`,
    body:
      rounded >= 15
        ? IMPACT_BY_PRESET[15].body
        : rounded >= 10
          ? IMPACT_BY_PRESET[10].body
          : IMPACT_BY_PRESET[5].body,
  };
}

export function getDonateTotalCents(selection: DonateAmountSelection): number | null {
  if (selection.kind === 'preset') {
    return selection.amount * 100;
  }
  const parsed = Number.parseFloat(selection.value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}
