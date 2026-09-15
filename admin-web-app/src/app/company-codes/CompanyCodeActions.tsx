'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { createCompanyCode, deleteCompanyCode } from '@/actions/companyCodes';
import { CopyIcon } from '@/components/ui/Icons';

export function GenerateCompanyCodeButton() {
  const router = useRouter();
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!createdCode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCreatedCode(null);
        setCopied(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createdCode]);

  const closeModal = () => {
    setCreatedCode(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-stretch sm:items-end gap-xs shrink-0">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const { code } = await createCompanyCode();
                setCopied(false);
                setCreatedCode(code);
                router.refresh();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : 'Could not generate code');
              }
            });
          }}
          className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {pending ? 'Generating…' : 'Generate code'}
        </button>
        {error ? (
          <p className="font-body text-[12px] text-[#ba1a1a]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {createdCode ? (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
            aria-label="Close"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-sm rounded-md bg-bg-surface border border-border-outline p-lg">
            <h3 id={titleId} className="font-heading text-[20px] text-text-primary mb-xs">
              Code generated
            </h3>
            <p className="font-body text-[13px] text-text-tertiary mb-md">
              Share this single-use code with the volunteer. It stays active until they redeem it.
            </p>
            <p className="mb-md rounded-sm border border-border-outline bg-bg-app px-md py-md text-center font-data text-[22px] font-semibold tracking-[0.18em] text-text-primary">
              {createdCode}
            </p>
            <p className="mb-md rounded-sm border border-border-outline bg-bg-app px-md py-sm font-body text-[12px] leading-[18px] text-text-tertiary">
              After they redeem, this list shows who used it. To look them up: open{' '}
              <span className="font-semibold text-text-primary">Volunteers</span> and search by name
              or email. If you only see a long ID instead of an email, paste that ID after{' '}
              <span className="font-data text-[11px] text-text-primary">/volunteers/</span> in the
              address bar (example:{' '}
              <span className="font-data text-[11px] text-text-primary">/volunteers/…</span>).
            </p>
            <div className="flex gap-sm justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="h-9 px-md inline-flex items-center gap-xs font-data text-[12px] font-semibold text-text-tertiary border border-border-outline rounded-sm hover:bg-bg-surface-elevated transition-colors"
              >
                <CopyIcon className="w-3.5 h-3.5" color="currentColor" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="h-9 px-md font-data text-[12px] font-semibold bg-primary text-white rounded-sm hover:bg-primary-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function DeleteCompanyCodeButton({ codeId }: { codeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('Delete this company code?')) {
          return;
        }
        startTransition(async () => {
          await deleteCompanyCode(codeId);
          router.refresh();
        });
      }}
      className="h-8 px-sm rounded-sm border border-[#ba1a1a]/40 text-[#ba1a1a] font-data text-[11px] font-semibold hover:bg-[#ffd9de] transition-colors disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
