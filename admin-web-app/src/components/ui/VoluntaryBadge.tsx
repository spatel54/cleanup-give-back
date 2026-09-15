/** Green volunteer-type pill - mirrors `CourtBadge` border treatment. */
export function VoluntaryBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-[#f7fff1] text-primary border-[#007536] ${className}`}
    >
      Voluntary
    </span>
  );
}
