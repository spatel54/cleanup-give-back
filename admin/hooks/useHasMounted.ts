'use client';

import { useEffect, useState } from 'react';

/** True only after client mount — use to defer Framer Motion entrance styles past SSR. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
