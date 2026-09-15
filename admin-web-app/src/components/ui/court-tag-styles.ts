/** Shared admin court marker - cool slate, distinct from amber under-review / deadline chips. */
export const COURT_TAG_PILL_CLASS =
  'inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap bg-[#e8eef5] text-[#243447] border-[#7a90a8]';

export function isCourtOrderedServiceType(serviceType: string): boolean {
  return serviceType.trim().toLowerCase() === 'court ordered';
}

/** Account service type next to a session Court badge. Court Ordered + court_ordered is the same signal twice. */
export function shouldShowSessionServiceTypeBadge(
  serviceType: string | null | undefined,
  courtOrdered: boolean,
): serviceType is string {
  if (!serviceType?.trim()) return false;
  if (courtOrdered && isCourtOrderedServiceType(serviceType)) return false;
  return true;
}
