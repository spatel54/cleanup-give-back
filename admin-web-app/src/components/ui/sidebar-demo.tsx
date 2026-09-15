"use client";

/**
 * App shell sidebar - Sanchez heading, IBM Plex data labels, left-aligned icon
 * rail. Badges/notifications stay empty until live counts are wired - never
 * fixture session/user numbers or fake volunteer names.
 */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import {
  AuditLogIcon,
  BellIcon,
  EventsIcon,
  FeedbackIcon,
  HomeIcon,
  InsightsIcon,
  MailIcon,
  OrdersIcon,
  PaymentsIcon,
  SessionsIcon,
  VolunteerIcon,
} from "@/components/ui/Icons";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSessionsRealtimeRefresh } from "@/lib/useSessionsRealtimeRefresh";

type ShellNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  href: string;
};

/** No fixture notifications - avoid fake volunteer names in the chrome. */
const SHELL_NOTIFICATIONS: ShellNotification[] = [];

export function SidebarDemo({ children }: { children: React.ReactNode }) {
  useSessionsRealtimeRefresh();
  const links = [
    {
      label: "Home",
      href: "/",
      icon: <HomeIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Attention",
      href: "/attention",
      icon: <BellIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Sessions",
      href: "/sessions?period=all",
      icon: <SessionsIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Users",
      href: "/users",
      icon: <VolunteerIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Insights",
      href: "/insights",
      icon: <InsightsIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Feedback",
      href: "/feedback",
      icon: <FeedbackIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Events",
      href: "/events",
      icon: <EventsIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Orders",
      href: "/orders",
      icon: <OrdersIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Payments",
      href: "/payments",
      icon: <PaymentsIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Audit Log",
      href: "/audit-log",
      icon: <AuditLogIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Emails",
      href: "/emails",
      icon: <MailIcon className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: "Company codes",
      href: "/company-codes",
      icon: <PaymentsIcon className="h-4 w-4 flex-shrink-0" />,
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row h-dvh bg-bg-app w-full overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-lg !px-sm !py-0">
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="min-h-16 py-md flex items-center shrink-0 border-b border-border-outline px-md">
              <div className="lg:hidden w-full">
                <Logo />
              </div>
              <div className="hidden lg:flex w-full items-center justify-center">
                {open ? (
                  <div className="w-full">
                    <Logo />
                  </div>
                ) : (
                  <LogoIcon />
                )}
              </div>
            </div>
            <nav className="flex-1 py-md px-0" aria-label="Main navigation">
              <ul className="flex flex-col gap-xs" role="list">
                {links.map((link) => (
                  <li key={link.href}>
                    <SidebarLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="shrink-0 border-t border-border-outline px-0 py-md flex flex-col gap-xs">
            <NotificationsControl />
            <SidebarLink
              link={{
                label: "Admin",
                href: "/profile",
                icon: (
                  <span
                    className="w-7 h-7 rounded-full bg-primary text-white font-data text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
                    aria-hidden
                  >
                    AD
                  </span>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col min-w-0 w-full overflow-hidden">
        <main className="flex-1 px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-8 lg:pt-8 overflow-x-hidden overflow-y-auto bg-bg-app w-full has-[.page-sticky-header]:pt-0 sm:has-[.page-sticky-header]:pt-0 lg:has-[.page-sticky-header]:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function NotificationsControl() {
  const { open, animate, setMobileOpen } = useSidebar();
  const showLabel = !animate || open;
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ bottom: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const prefersReduced = useReducedMotion() ?? false;
  const unread = SHELL_NOTIFICATIONS.filter((n) => n.unread).length;

  useLayoutEffect(() => {
    if (!panelOpen || !buttonRef.current) {
      setPanelPos(null);
      return;
    }
    function place() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth - 16, 320);
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelWidth - 8);
      }
      // Anchor above the trigger so height can grow without guessing.
      const bottom = Math.max(8, window.innerHeight - rect.top + 8);
      setPanelPos({ bottom, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [panelOpen, open, showLabel]);

  useEffect(() => {
    if (!panelOpen) return;
    function onPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setPanelOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  const panel =
    panelOpen && panelPos
      ? createPortal(
          <motion.div
            ref={panelRef}
            id={titleId}
            role="dialog"
            aria-label="Notifications"
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed z-[200] w-[min(calc(100vw-2rem),20rem)] max-h-[min(24rem,calc(100vh-2rem))] rounded-md border border-border-outline bg-bg-surface shadow-bar-top overflow-hidden flex flex-col"
            style={{ bottom: panelPos.bottom, left: panelPos.left }}
          >
            <div className="px-md py-sm border-b border-border-outline flex items-center justify-between gap-sm shrink-0">
              <p className="font-heading text-[16px] text-text-primary">Notifications</p>
              <span className="font-data text-[11px] text-text-tertiary">{unread} unread</span>
            </div>
            {SHELL_NOTIFICATIONS.length === 0 ? (
              <p className="px-md py-lg font-body text-[13px] text-text-tertiary">No notifications yet.</p>
            ) : (
              <ul role="list" className="min-h-0 overflow-y-auto divide-y divide-border-outline">
                {SHELL_NOTIFICATIONS.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        setPanelOpen(false);
                        setMobileOpen(false);
                      }}
                      className="block px-md py-sm hover:bg-bg-surface-elevated transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <div className="flex items-start gap-sm">
                        {n.unread ? (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                        ) : (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-transparent shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-[13px] font-medium text-text-primary">{n.title}</p>
                          <p className="font-body text-[12px] text-text-tertiary mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="font-data text-[10px] text-text-tertiary mt-1">{n.time}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        aria-controls={titleId}
        className={`w-full relative flex items-center min-h-11 rounded-sm font-data text-[12px] font-semibold leading-[18px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary text-text-tertiary hover:text-text-primary hover:bg-bg-app border border-transparent gap-sm px-md ${
          !showLabel ? "lg:gap-0 lg:px-0 lg:justify-center" : ""
        }`}
      >
        <span className="relative inline-flex shrink-0">
          <BellIcon className="h-4 w-4" aria-hidden />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#ba1a1a] text-white font-data text-[9px] font-semibold inline-flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span
          className={`min-w-0 flex-1 items-center gap-sm whitespace-nowrap ${
            showLabel ? "inline-flex" : "inline-flex lg:hidden"
          }`}
        >
          Notifications
          {unread > 0 && (
            <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#ffddb5] text-[#835400] font-data text-[11px] font-semibold border border-[#fcab29]">
              {unread}
            </span>
          )}
        </span>
      </button>
      {panel}
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="flex items-center gap-sm min-w-0 relative z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
    >
      <span className="block size-8 shrink-0 overflow-hidden rounded">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Clean Up – Give Back"
          width={32}
          height={32}
          className="size-full max-w-none object-cover object-center"
        />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-[14px] leading-[18px] text-text-primary truncate">
          CleanUpGiveBack
        </span>
        <span className="block font-data text-[10px] text-text-tertiary tracking-widest uppercase">
          Admin
        </span>
      </span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="inline-flex size-8 items-center justify-center relative z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
      title="Clean Up – Give Back Admin"
    >
      <span className="block size-8 shrink-0 overflow-hidden rounded">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Clean Up – Give Back"
          width={32}
          height={32}
          className="size-full max-w-none object-cover object-center"
        />
      </span>
    </Link>
  );
};
