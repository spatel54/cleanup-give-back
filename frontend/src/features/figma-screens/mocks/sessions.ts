export type SessionApprovalStatus = 'approved' | 'pending' | 'declined';

export type SessionListFilter = 'all' | 'approved' | 'under-review' | 'declined';

export type SessionSortOption = 'most-recent' | 'oldest-first' | 'title-az' | 'title-za';

export type SessionListItem = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  /** ISO date for sorting (session start day). */
  sortDate: string;
  status: SessionApprovalStatus;
};

/** Local fallback when `EXPO_PUBLIC_API_URL` is unset — mix of statuses for bulk delete demos. */
export const mockSessionsList: SessionListItem[] = [
  {
    id: 'downtown-riverfront',
    title: 'Downtown Riverfront Clean-up',
    dateLabel: 'Jul 15, 2026',
    timeLabel: '5:00–7:30 PM',
    sortDate: '2026-07-15',
    status: 'approved',
  },
  {
    id: 'mckinley-park',
    title: 'McKinley Park Restoration',
    dateLabel: 'Jul 12, 2026',
    timeLabel: '9:00–11:00 AM',
    sortDate: '2026-07-12',
    status: 'pending',
  },
  {
    id: 'algonquin-trail',
    title: 'Algonquin Trail Sweep',
    dateLabel: 'Jul 8, 2026',
    timeLabel: '1:00–3:00 PM',
    sortDate: '2026-07-08',
    status: 'pending',
  },
  {
    id: 'des-plaines-river',
    title: 'Des Plaines Riverbank',
    dateLabel: 'Jul 3, 2026',
    timeLabel: '10:00–12:30 PM',
    sortDate: '2026-07-03',
    status: 'declined',
  },
  {
    id: 'oakton-park',
    title: 'Oakton Park Litter Pick',
    dateLabel: 'Jun 28, 2026',
    timeLabel: '4:00–6:00 PM',
    sortDate: '2026-06-28',
    status: 'declined',
  },
  {
    id: 'lake-parkway',
    title: 'Lake Parkway Median',
    dateLabel: 'Jun 20, 2026',
    timeLabel: '8:00–10:00 AM',
    sortDate: '2026-06-20',
    status: 'approved',
  },
];

export const SESSION_FILTER_CHIPS: { id: SessionListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'under-review', label: 'Under Review' },
  { id: 'declined', label: 'Declined' },
];

export const SESSION_SORT_OPTIONS: { id: SessionSortOption; label: string }[] = [
  { id: 'most-recent', label: 'MOST RECENT' },
  { id: 'oldest-first', label: 'OLDEST FIRST' },
  { id: 'title-az', label: 'A–Z' },
  { id: 'title-za', label: 'Z–A' },
];

export function filterMatchesStatus(
  filter: SessionListFilter,
  status: SessionApprovalStatus,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'approved':
      return status === 'approved';
    case 'under-review':
      return status === 'pending';
    case 'declined':
      return status === 'declined';
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function sortSessions(
  sessions: SessionListItem[],
  sort: SessionSortOption,
): SessionListItem[] {
  const next = [...sessions];
  switch (sort) {
    case 'most-recent':
      return next.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    case 'oldest-first':
      return next.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    case 'title-az':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-za':
      return next.sort((a, b) => b.title.localeCompare(a.title));
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}
