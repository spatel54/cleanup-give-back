import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Adapter for shadcn-style components (e.g. `frontend/src/components/ui/map.tsx`)
 * that expect a `useTheme` hook returning `{ colorScheme }`. Wraps the repo's
 * existing `useColorScheme` hook rather than introducing a second theme system —
 * see `@/hooks/use-theme` for the app's `Colors[theme]` palette hook.
 */
export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  return { colorScheme } as const;
}
