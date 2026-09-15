'use client';

import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from '@/components/ui/Icons';

/**
 * Shared debounced text search input used across Home, Sessions, Orders, and
 * Users. Callers decide whether `onChange` pushes a URL param (server-scoped
 * filtering) or updates local state (client-scoped filtering) — this
 * component only owns the debounce + input chrome.
 */
export function AdminSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  debounceMs = 300,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setLocal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), debounceMs);
  }

  return (
    <label
      className={`flex min-h-11 items-center gap-md rounded-sm border border-border-outline bg-bg-surface px-md focus-within:border-primary focus-within:outline focus-within:outline-2 focus-within:outline-primary ${className}`}
    >
      <span className="sr-only">{placeholder}</span>
      <SearchIcon className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
      <input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-11 w-full border-0 bg-transparent py-0 font-body text-[14px] text-text-primary focus:outline-none"
      />
    </label>
  );
}
