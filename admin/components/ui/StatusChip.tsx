import type { SessionStatus } from '@/types/database';

const STATUS_MAP: Record<SessionStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-[#f6f3f2] text-[#3e4a3d] border-[#bdcaba]',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-[#ffddb5] text-[#835400] border-[#fcab29]',
  },
  approved: {
    label: 'Approved',
    className: 'bg-[#f7fff1] text-[#007536] border-[#007536]',
  },
  not_approved: {
    label: 'Declined',
    className: 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]',
  },
  // Legacy DB rows only — "Invalid" is not a product status.
  invalid: {
    label: 'Declined',
    className: 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]',
  },
};

export function StatusChip({ status }: { status: SessionStatus }) {
  const { label, className } = STATUS_MAP[status] ?? STATUS_MAP.active;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
}
