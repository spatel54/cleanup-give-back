'use client';

import { useState, type FocusEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { NavBadges } from '@/lib/nav-badges';
import {
  HomeIcon,
  SessionIcon,
  VolunteerIcon,
  InsightsIcon,
  FeedbackIcon,
  EventIcon,
  OrderIcon,
  PaymentIcon,
  AccountIcon,
  SignOutIcon,
  type IconProps,
} from '@/components/ui/Icons';

const COLLAPSED_W = 72; // 4.5rem — icon rail
const EXPANDED_W = 240; // 15rem / w-60

type NavItem = {
  href: string;
  label: string;
  icon: (props: IconProps) => ReactNode;
  badgeKey?: keyof Pick<NavBadges, 'sessionsUnderReview' | 'courtAtRisk' | 'openOrders'>;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: HomeIcon },
  { href: '/sessions', label: 'Sessions', icon: SessionIcon, badgeKey: 'sessionsUnderReview' },
  { href: '/users', label: 'Users', icon: VolunteerIcon, badgeKey: 'courtAtRisk' },
  { href: '/insights', label: 'Insights', icon: InsightsIcon },
  { href: '/feedback', label: 'Feedback', icon: FeedbackIcon },
  { href: '/events', label: 'Events', icon: EventIcon },
  { href: '/orders', label: 'Orders', icon: OrderIcon, badgeKey: 'openOrders' },
  { href: '/payments', label: 'Payments', icon: PaymentIcon },
];

function Badge({ count, label }: { count: number; label: string }) {
  if (count === 0) return null;
  const displayCount = count > 99 ? '99+' : String(count);
  return (
    <span
      className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#ffddb5] text-[#835400] font-data text-[11px] font-semibold border border-[#fcab29]"
      aria-label={`${count} ${label}`}
    >
      {displayCount}
    </span>
  );
}

/**
 * Label fade — Aceternity SidebarLink pattern (opacity + display),
 * adapted for flex children (badges) without adopting Aceternity styles.
 */
function NavLabel({ expanded, children }: { expanded: boolean; children: ReactNode }) {
  const prefersReduced = useReducedMotion() ?? false;
  return (
    <motion.span
      initial={false}
      animate={{
        display: expanded ? 'inline-flex' : 'none',
        opacity: expanded ? 1 : 0,
      }}
      transition={prefersReduced ? { duration: 0 } : undefined}
      aria-hidden={!expanded}
      className="min-w-0 items-center gap-sm whitespace-nowrap !p-0 !m-0"
      style={{ pointerEvents: expanded ? 'auto' : 'none' }}
    >
      {children}
    </motion.span>
  );
}

export function Sidebar({
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
  const prefersReduced = useReducedMotion() ?? false;
  /** Collapsed icon rail by default; opens on hover or keyboard focus (Aceternity open state). */
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function handleBlur(e: FocusEvent<HTMLElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  const linkBase =
    'flex items-center min-h-11 rounded-sm font-data text-[12px] font-semibold leading-[18px] transition-[color,background-color,padding,gap] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
  const linkActive = 'bg-[#f7fff1] text-primary border border-primary/30';
  const linkIdle = 'text-text-tertiary hover:text-text-primary hover:bg-bg-app border border-transparent';

  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? EXPANDED_W : COLLAPSED_W }}
      transition={prefersReduced ? { duration: 0 } : undefined}
      className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0 bg-bg-surface-elevated border-r border-border-outline overflow-hidden"
      data-collapsed={open ? 'false' : 'true'}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
    >
      <div
        className={`min-h-16 py-md flex items-center border-b border-border-outline shrink-0 ${
          open ? 'px-lg gap-sm' : 'justify-center px-sm'
        }`}
      >
        <Link
          href="/"
          className={`flex items-center min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm ${
            open ? 'gap-sm flex-1' : 'justify-center'
          }`}
          title={open ? undefined : 'Clean Up – Give Back Admin'}
        >
          <span className="block size-8 shrink-0 overflow-hidden rounded">
            <img
              src="/logo.png"
              alt="Clean Up – Give Back"
              width={32}
              height={32}
              className="size-full max-w-none object-cover object-center"
            />
          </span>
          <NavLabel expanded={open}>
            <span className="min-w-0">
              <span className="block font-heading text-[14px] leading-[18px] text-text-primary truncate">
                CleanUpGiveBack
              </span>
              <span className="block font-data text-[10px] text-text-tertiary tracking-widest uppercase">
                Admin
              </span>
            </span>
          </NavLabel>
        </Link>
      </div>

      <nav
        id="admin-sidebar-nav"
        className="flex-1 min-h-0 py-md px-sm overflow-y-auto overflow-x-hidden"
        aria-label="Main navigation"
      >
        <ul className="flex flex-col gap-xs" role="list">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            const badgeLabel =
              item.badgeKey === 'sessionsUnderReview'
                ? 'under review'
                : item.badgeKey === 'courtAtRisk'
                  ? 'at risk'
                  : item.badgeKey === 'openOrders'
                    ? 'open orders'
                    : 'items';
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={open ? undefined : item.label}
                  aria-label={open ? undefined : item.label}
                  className={`${linkBase} ${active ? linkActive : linkIdle} ${
                    open ? 'gap-sm px-md' : 'justify-center px-0'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden />
                  <NavLabel expanded={open}>
                    {item.label}
                    <Badge count={count} label={badgeLabel} />
                  </NavLabel>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Full-bleed divider — outside padded nav so the rule spans the rail */}
      <div className="shrink-0 border-t border-border-outline">
        <div className="px-sm py-md flex flex-col gap-xs">
          <Link
            href="/account"
            title={open ? undefined : accountName}
            aria-label={open ? undefined : accountName}
            className={`${linkBase} ${
              isActive('/account') ? linkActive : 'text-text-tertiary hover:text-text-primary hover:bg-bg-app'
            } ${open ? 'gap-sm px-md' : 'justify-center px-0'}`}
            aria-current={isActive('/account') ? 'page' : undefined}
          >
            <span
              className="w-7 h-7 rounded-full bg-primary text-white font-data text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
              aria-hidden
            >
              {accountInitials}
            </span>
            <NavLabel expanded={open}>
              <span className="min-w-0 flex-1 truncate">{accountName}</span>
              <AccountIcon className="w-4 h-4 shrink-0 opacity-70" />
            </NavLabel>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            title={open ? undefined : 'Sign out'}
            aria-label={open ? undefined : 'Sign out'}
            className={`w-full ${linkBase} text-text-tertiary hover:text-text-primary hover:bg-bg-app ${
              open ? 'gap-sm px-md' : 'justify-center px-0'
            }`}
          >
            <SignOutIcon className="w-4 h-4 shrink-0" />
            <NavLabel expanded={open}>Sign out</NavLabel>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
