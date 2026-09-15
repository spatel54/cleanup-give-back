/**
 * Court-ordered session/volunteer marker. Deliberately a cool slate — not amber —
 * so it never reads as another Under Review warning (`StatusChip`'s `under_review`
 * variant owns the amber palette for queue urgency).
 */
export function CourtBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-[#e8eef5] text-[#243447] border-[#7a90a8] ${className}`}
    >
      Court
    </span>
  );
}
