'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { NavBadges } from '@/lib/nav-badges';
import {
  HomeIcon,
  SessionIcon,
  VolunteerIcon,
  EventIcon,
  MoreIcon,
  MenuIcon,
  CloseIcon,
} from '@/components/ui/Icons';

const PRIMARY_NAV = [
  { href: '/', label: 'Dashboard', badgeKey: null as null, icon: HomeIcon },
  { href: '/sessions', label: 'Sessions', badgeKey: 'sessionsUnderReview' as const, icon: SessionIcon },
  { href: '/users', label: 'Users', badgeKey: 'courtAtRisk' as const, icon: VolunteerIcon },
  { href: '/events', label: 'Events', badgeKey: null as null, icon: EventIcon },
];

const MORE_NAV = [
  { href: '/insights', label: 'Insights' },
  { href: '/feedback', label: 'Feedback' },
  { href: '/orders', label: 'Orders', badgeKey: 'openOrders' as const },
  { href: '/payments', label: 'Payments' },
];

function MiniBadge({ count }: { count: number }) {
  if (count === 0) return null;
  const displayCount = count > 99 ? '99+' : String(count);
  return (
    <span
      className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-[#ffddb5] text-[#835400] font-data text-[9px] font-semibold border border-[#fcab29] flex items-center justify-center"
      aria-label={`${count} items`}
    >
      {displayCount}
    </span>
  );
}

export function MobileNav({
  badges,
  accountName = 'Admin',
  accountInitials = 'DA',
}: {
  badges: NavBadges;
  accountName?: string;
  accountInitials?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <header className="lg:hidden h-14 bg-bg-surface-elevated border-b border-border-outline flex items-center justify-between px-lg shadow-bar-top">
        <Link href="/" className="flex items-center gap-sm min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm">
          <span className="block size-7 shrink-0 overflow-hidden rounded">
            <img
              src="/logo.png"
              alt="Clean Up – Give Back"
              width={28}
              height={28}
              className="size-full max-w-none object-cover object-center"
            />
          </span>
          <span className="font-heading text-[16px] text-text-primary">Admin</span>
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="interactive min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm hover:bg-bg-app transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <CloseIcon className="w-5 h-5" aria-hidden />
          ) : (
            <MenuIcon className="w-5 h-5" aria-hidden />
          )}
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
              className="lg:hidden fixed inset-0 z-40 bg-[var(--color-overlay-scrim)]"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: prefersReducedMotion ? 0 : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : '100%' }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-64 bg-bg-surface flex flex-col"
            >
              <div className="h-14 flex items-center justify-between px-lg border-b border-border-outline">
                <span className="font-heading text-[16px]">Menu</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <CloseIcon className="w-5 h-5" aria-hidden />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-md px-sm">
                {[...PRIMARY_NAV, ...MORE_NAV].map((item) => {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between min-h-11 px-md rounded-sm font-data text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                        isActive(item.href)
                          ? 'bg-[#f7fff1] text-primary'
                          : 'text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="mt-md pt-md border-t border-border-outline flex flex-col gap-xs">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-sm min-h-11 px-md rounded-sm font-data text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      isActive('/account')
                        ? 'bg-[#f7fff1] text-primary'
                        : 'text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full bg-primary text-white font-data text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      {accountInitials}
                    </span>
                    <span className="min-w-0">
                      <span className="block">Account</span>
                      <span className="block font-normal text-[10px] text-text-tertiary">{accountName}</span>
                    </span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full min-h-11 px-md text-left rounded-sm font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-surface border-t border-border-outline shadow-nav-bottom">
        <ul className="flex" role="list">
          {PRIMARY_NAV.map((item) => {
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center min-h-14 gap-1 font-data text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    isActive(item.href) ? 'text-primary' : 'text-text-tertiary'
                  }`}
                >
                  <span className="relative inline-flex" aria-hidden>
                    <Icon className="w-5 h-5" />
                    <MiniBadge count={count} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-full flex flex-col items-center justify-center min-h-14 gap-1 font-data text-[11px] font-semibold text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <MoreIcon className="w-5 h-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
