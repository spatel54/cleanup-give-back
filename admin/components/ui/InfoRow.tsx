export function InfoRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-xs sm:gap-md py-sm border-b border-border-outline last:border-0">
      <dt className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary sm:w-40 shrink-0">{label}</dt>
      <dd className="font-body text-[14px] text-text-primary min-w-0">
        {value}
        {note ? <span className="block mt-xs font-body text-[12px] text-text-tertiary">{note}</span> : null}
      </dd>
    </div>
  );
}
