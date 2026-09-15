/**
 * Renders `AuditChangeLine[]` from `describeAuditChanges` as stacked field transitions -
 * each change reads left-to-right as "what it was → what it became" instead of scanning
 * a Before/After column grid.
 *
 * Value pills are tinted by the *value's* tone (`fromTone`/`toTone`), not column position,
 * so "Declined" in After never looks like "Approved".
 */
import type { AuditChangeLine, AuditValueTone } from "@/lib/audit-log-summary";
import { ChevronRightIcon } from "@/components/ui/Icons";

const TONE_PILL: Record<AuditValueTone, string> = {
  positive: "bg-[#f7fff1] text-[#007536] border-[#007536]",
  negative: "bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]",
  neutral: "bg-bg-surface-elevated text-text-primary border-border-outline",
};

const EMPTY_PILL = "bg-bg-surface-elevated text-text-tertiary border-dashed border-border-outline italic";

function ValuePill({ value, tone }: { value: string; tone?: AuditValueTone }) {
  const isEmpty = value === "-";
  const className = isEmpty
    ? EMPTY_PILL
    : tone
      ? TONE_PILL[tone]
      : "bg-bg-surface text-text-primary border-border-outline";

  return (
    <span
      className={`inline-flex max-w-[160px] items-center px-2 py-0.5 rounded-sm border font-body text-[12px] leading-[16px] truncate ${className}`}
      title={value}
    >
      {value}
    </span>
  );
}

function ChangeRow({ change }: { change: AuditChangeLine }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="font-data text-[10px] font-medium tracking-[0.6px] text-text-tertiary uppercase">
        {change.label}
      </span>
      <div className="flex flex-wrap items-center gap-xs">
        <ValuePill value={change.from} tone={change.fromTone} />
        <ChevronRightIcon className="w-3.5 h-3.5 shrink-0 text-text-tertiary" aria-hidden />
        <ValuePill value={change.to} tone={change.toTone} />
      </div>
    </div>
  );
}

export function AuditDiffCard({ changes }: { changes: AuditChangeLine[] }) {
  if (changes.length === 0) {
    return <span className="font-body text-[13px] text-text-tertiary">No field changes recorded</span>;
  }

  return (
    <div className="flex flex-col gap-sm min-w-[200px] max-w-[320px]">
      {changes.map((change) => (
        <ChangeRow key={change.label} change={change} />
      ))}
    </div>
  );
}
