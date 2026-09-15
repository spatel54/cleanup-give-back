/** Shows a volunteer's account-level service-type classification next to their name. */
import {
  COURT_TAG_PILL_CLASS,
  isCourtOrderedServiceType,
} from '@/components/ui/court-tag-styles';

const DEFAULT_SERVICE_TYPE_CLASS =
  'inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-[#f2f0e8] text-[#4a4536] border-[#a89f83]';

export function ServiceTypeBadge({
  serviceType,
  className = "",
}: {
  serviceType: string;
  className?: string;
}) {
  const pillClass = isCourtOrderedServiceType(serviceType)
    ? COURT_TAG_PILL_CLASS
    : DEFAULT_SERVICE_TYPE_CLASS;

  return (
    <span className={`${pillClass} ${className}`}>
      {serviceType}
    </span>
  );
}
