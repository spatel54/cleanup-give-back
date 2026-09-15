'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon } from '@/components/ui/Icons';

interface Command {
  id: string;
  label: string;
  href: string;
  keywords?: string[];
}

const COMMANDS: Command[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', keywords: ['home'] },
  { id: 'sessions-review', label: 'Sessions under review', href: '/sessions?status=under_review' },
  { id: 'sessions-all', label: 'All sessions', href: '/sessions' },
  { id: 'users-court', label: 'Users court', href: '/users?court=1', keywords: ['court-ordered'] },
  { id: 'users-all', label: 'All users', href: '/users' },
  { id: 'events-new', label: 'New event', href: '/events/new', keywords: ['create'] },
  { id: 'events-all', label: 'All events', href: '/events' },
  { id: 'orders', label: 'Orders', href: '/orders' },
  { id: 'feedback', label: 'Feedback', href: '/feedback' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCommands = query.trim()
    ? COMMANDS.filter((cmd) => {
        const needle = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(needle) ||
          cmd.keywords?.some((k) => k.includes(needle))
        );
      })
    : COMMANDS;

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        if (!open) setQuery('');
      }
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      }
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        router.push(filteredCommands[selectedIndex].href);
        setOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, selectedIndex, filteredCommands, router]);

  if (!mounted) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            className="fixed inset-0 z-[100] bg-[var(--color-overlay-scrim)]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[20vh] px-lg pointer-events-none">
            <motion.div
              initial={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-xl bg-bg-surface border border-border-outline rounded-md shadow-bar-top overflow-hidden pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="flex items-center gap-sm px-md py-sm border-b border-border-outline">
                <SearchIcon className="w-4 h-4 text-text-tertiary shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands…"
                  autoFocus
                  className="flex-1 bg-transparent font-body text-base text-text-primary placeholder:text-text-tertiary outline-none"
                />
                <kbd className="font-data text-[11px] text-text-tertiary border border-border-outline rounded px-xs py-0.5">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <p className="px-lg py-md font-body text-[14px] text-text-tertiary text-center">
                    No commands found.
                  </p>
                ) : (
                  <ul role="listbox">
                    {filteredCommands.map((cmd, i) => (
                      <li key={cmd.id} role="option" aria-selected={i === selectedIndex}>
                        <button
                          type="button"
                          onClick={() => {
                            router.push(cmd.href);
                            setOpen(false);
                            setQuery('');
                          }}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`w-full text-left px-lg py-md font-body text-base transition-colors ${
                            i === selectedIndex
                              ? 'bg-[#f7fff1] text-primary'
                              : 'text-text-primary hover:bg-bg-surface-elevated'
                          }`}
                        >
                          {cmd.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-md py-sm border-t border-border-outline flex items-center justify-between">
                <span className="font-data text-[11px] text-text-tertiary">
                  Navigate with ↑ ↓, select with ↵
                </span>
                <span className="font-data text-[11px] text-text-tertiary">
                  <kbd className="border border-border-outline rounded px-xs py-0.5">⌘</kbd>
                  <kbd className="border border-border-outline rounded px-xs py-0.5 ml-xs">K</kbd> to close
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
