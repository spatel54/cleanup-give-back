'use client';

/**
 * Internal health-check panel for `SettingsPage.tsx` - renders the results of
 * `runAllHealthChecks` (`lib/health-checks.ts`) and lets Admin re-run them on demand via
 * the `refreshHealthChecks` server action (`actions/health.ts`).
 */
import { useState, useTransition } from 'react';
import { refreshHealthChecks } from '@/actions/health';
import type { HealthCheckResult } from '@/lib/health-checks';

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[11px] font-semibold uppercase tracking-[0.5px] whitespace-nowrap ${
        ok
          ? 'bg-[#f7fff1] border-primary/30 text-primary'
          : 'bg-[#ffd9de] border-[#ba1a1a]/30 text-[#ba1a1a]'
      }`}
    >
      {ok ? 'OK' : 'Failing'}
    </span>
  );
}

export function ProductionReadinessPanel({ initialChecks }: { initialChecks: HealthCheckResult[] }) {
  const [checks, setChecks] = useState(initialChecks);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      try {
        const next = await refreshHealthChecks();
        setChecks(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run health checks');
      }
    });
  }

  const failingCount = checks.filter((c) => !c.ok).length;

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
      <div className="px-lg py-md border-b border-border-outline flex items-center justify-between gap-md">
        <div>
          <h2 className="font-heading text-[18px] text-text-primary">Production Readiness</h2>
          <p className="font-body text-[12px] text-text-tertiary mt-xs">
            {failingCount === 0
              ? 'All checks passing.'
              : `${failingCount} check${failingCount === 1 ? '' : 's'} failing.`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors disabled:opacity-50 shrink-0"
        >
          {isPending ? 'Checking…' : 'Re-run'}
        </button>
      </div>
      {error && (
        <p className="px-lg py-sm font-body text-[12px] text-[#ba1a1a] border-b border-border-outline">
          {error}
        </p>
      )}
      <div className="divide-y divide-border-outline">
        {checks.map((check) => (
          <div key={check.name} className="px-lg py-md flex items-center justify-between gap-md">
            <div className="min-w-0">
              <p className="font-body text-[14px] text-text-primary">{check.name}</p>
              {check.detail && (
                <p className="font-body text-[12px] text-text-tertiary mt-xs truncate">{check.detail}</p>
              )}
            </div>
            <div className="flex items-center gap-sm shrink-0">
              {check.latencyMs != null && (
                <span className="font-data text-[11px] text-text-tertiary tabular-nums">
                  {check.latencyMs}ms
                </span>
              )}
              <StatusPill ok={check.ok} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
