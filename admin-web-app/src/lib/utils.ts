import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional Tailwind class names, resolving conflicting
 * utility classes (twMerge) after combining conditional inputs (clsx).
 * Used by shadcn-style components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}