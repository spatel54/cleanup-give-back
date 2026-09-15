'use client';

import { useState } from 'react';
import { CopyIcon } from '@/components/ui/Icons';

export function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed, ignore silently
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-data text-[12px] text-primary hover:underline inline-flex items-center gap-2"
      aria-label="Copy shipping address"
    >
      <CopyIcon className="w-3.5 h-3.5" color="currentColor" />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}