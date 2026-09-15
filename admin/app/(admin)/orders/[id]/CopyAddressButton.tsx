'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CopyIcon } from '@/components/ui/Icons';

export function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="gap-xs"
      type="button"
    >
      <CopyIcon className="w-4 h-4" />
      {copied ? 'Copied!' : 'Copy Address'}
    </Button>
  );
}
