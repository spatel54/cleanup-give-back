import { format, parseISO } from 'date-fns';

export function formatDate(iso: string | null | undefined, fmt = 'MMM dd, yyyy') {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return '—';
  }
}

export function formatDuration(seconds: number | null | undefined, adjustedHours?: number | null) {
  if (adjustedHours != null) {
    const h = Math.floor(adjustedHours);
    const m = Math.round((adjustedHours - h) * 60);
    return `${h}h ${m}m (adjusted)`;
  }
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function computedHours(seconds: number | null | undefined, adjustedHours?: number | null): number {
  if (adjustedHours != null) return adjustedHours;
  if (!seconds) return 0;
  return seconds / 3600;
}

export function formatMiles(miles: number | null | undefined) {
  if (miles == null) return '—';
  return `${Number(miles).toFixed(2)} mi`;
}

export function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}
