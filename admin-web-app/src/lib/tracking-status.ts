/** Shippo stores UNKNOWN before the first carrier scan. Show Pending instead. */
export function formatTrackingStatusLabel(status: string | null | undefined): string {
  const normalized = status?.trim();
  if (!normalized) return 'Pending';
  if (normalized.toUpperCase() === 'UNKNOWN') return 'Pending';
  return normalized
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
