"use client";

import { cn } from "@/lib/utils";
import Link, { type LinkProps } from "next/link";
import React, { useEffect, useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  badge?: number;
  badgeLabel?: string;
}

interface SidebarContextProps {
  /** Desktop rail expanded (hover). */
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Mobile nav drawer open. */
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, mobileOpen, setMobileOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const width = animate ? (open ? "240px" : "72px") : "240px";
  return (
    <motion.div
      className={cn(
        // lg (1024px)+ - matches admin Sidebar; tablets keep the overlay drawer.
        "h-full hidden lg:flex lg:flex-col bg-bg-surface-elevated border-r border-border-outline flex-shrink-0 overflow-hidden",
        className,
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
      initial={false}
      animate={{ width }}
      style={{ width }}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { mobileOpen, setMobileOpen } = useSidebar();

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, setMobileOpen]);

  return (
    <>
      <div
        className={cn(
          "h-14 sm:h-16 px-4 py-3 flex flex-row lg:hidden items-center justify-between bg-bg-surface border-b border-border-outline w-full shrink-0",
        )}
        {...props}
      >
        <Link href="/" className="flex items-center gap-sm min-w-0">
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
        <button
          type="button"
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:text-text-primary hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon className="w-5 h-5" aria-hidden />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className={cn(
                "absolute left-0 top-0 h-full w-[min(100%,20rem)] bg-bg-surface-elevated shadow-nav-bottom flex flex-col justify-between overflow-y-auto",
                className,
              )}
            >
              <button
                type="button"
                className="absolute right-3 top-3 z-10 min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm text-text-tertiary hover:text-text-primary hover:bg-bg-app focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <CloseIcon className="w-5 h-5" aria-hidden />
              </button>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

function NavBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  const displayCount = count > 99 ? "99+" : String(count);
  return (
    <span
      className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#ffddb5] text-[#835400] font-data text-[11px] font-semibold border border-[#fcab29]"
      aria-label={`${count} ${label}`}
    >
      {displayCount}
    </span>
  );
}

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const showLabel = !animate || open;
  const active =
    link.href === "/"
      ? pathname === "/" || pathname === "/dashboard"
      : pathname.startsWith(link.href);

  return (
    <Link
      href={link.href}
      onClick={() => setMobileOpen(false)}
      title={showLabel ? undefined : link.label}
      aria-label={showLabel ? undefined : link.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center min-h-11 rounded-sm font-data text-[12px] font-semibold leading-[18px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary border",
        active
          ? "bg-[#f7fff1] text-primary border-primary/30"
          : "text-text-tertiary hover:text-text-primary hover:bg-bg-app border-transparent",
        // Overlay drawer is always expanded; desktop rail collapses with hover.
        showLabel ? "gap-sm px-md" : "gap-sm px-md lg:gap-0 lg:px-0 lg:justify-center",
        className,
      )}
      {...props}
    >
      <span className="relative inline-flex shrink-0">
        {link.icon}
        {!showLabel && link.badge != null && link.badge > 0 && (
          <span
            className="hidden lg:block absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#fcab29] border border-bg-surface-elevated"
            aria-hidden
          />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 items-center gap-sm whitespace-nowrap",
          showLabel ? "inline-flex" : "inline-flex lg:hidden",
        )}
      >
        {link.label}
        {link.badge != null && link.badge > 0 && (
          <NavBadge count={link.badge} label={link.badgeLabel ?? "items"} />
        )}
      </span>
    </Link>
  );
};
