'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Scroll main content to top on route change so pages don't inherit scroll position. */
export function MainScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
