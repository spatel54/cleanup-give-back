/**
 * the admin's shipping carton: 16×5×2 in @ 1 lb.
 * Kit, tote, and default all use this box. Per-kind SHIP_PARCEL_* env still overrides.
 */

export type Parcel = {
  length: string;
  width: string;
  height: string;
  distance_unit: 'in';
  weight: string;
  mass_unit: 'lb';
};

export type ParcelKind = 'kit' | 'tote' | 'default';

const CARTON = { length: '16', width: '5', height: '2', weight: '1' } as const;

function parcelFromEnv(prefix: 'KIT' | 'TOTE' | 'DEFAULT'): Parcel {
  const read = (suffix: 'L' | 'W' | 'H' | 'LB') =>
    process.env[`SHIP_PARCEL_${prefix}_${suffix}`]?.trim();
  return {
    length: read('L') || CARTON.length,
    width: read('W') || CARTON.width,
    height: read('H') || CARTON.height,
    distance_unit: 'in',
    weight: read('LB') || CARTON.weight,
    mass_unit: 'lb',
  };
}

const KIT = parcelFromEnv('KIT');
const TOTE = parcelFromEnv('TOTE');
const DEFAULT_BOX = parcelFromEnv('DEFAULT');

function itemIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      return String((entry as { id?: unknown }).id ?? '').trim();
    })
    .filter(Boolean);
}

export function pickParcel(includesKit: boolean, items: unknown): { kind: ParcelKind; parcel: Parcel } {
  const ids = itemIds(items);
  const hasKit = includesKit || ids.includes('cleanup-kit');
  const hasTote = ids.includes('tote-bags');
  if (hasKit) return { kind: 'kit', parcel: KIT };
  if (hasTote) return { kind: 'tote', parcel: TOTE };
  return { kind: 'default', parcel: DEFAULT_BOX };
}
