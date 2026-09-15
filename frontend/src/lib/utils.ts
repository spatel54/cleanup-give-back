import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional Tailwind/NativeWind class names, resolving conflicting
 * utility classes (twMerge) after combining conditional inputs (clsx).
 * Used by shadcn-style components (e.g. `frontend/src/components/ui/map.tsx`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
