/** Ported verbatim from `admin/components/ui/CourtBadge.tsx`. */
import { COURT_TAG_PILL_CLASS } from '@/components/ui/court-tag-styles';

export function CourtBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`${COURT_TAG_PILL_CLASS} ${className}`}>
      Court
    </span>
  );
}
