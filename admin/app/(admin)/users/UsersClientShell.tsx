'use client';

import { useMemo, useState } from 'react';
import { AdminSearchBar } from '@/components/ui/AdminSearchBar';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { formatDate } from '@/lib/format';
import { UserPreviewDrawer } from './UserPreviewDrawer';

export type UserRow = {
  id: string;
  name: string;
  email: string;
  sessions: number;
  totalHours: number;
  courtOrdered: boolean;
  lastActive: string | null;
  joinedAt: string | null;
  requiredHours: number | null;
  completedHours: number | null;
  courtStatus: 'in_progress' | 'at_risk' | 'completed' | null;
};

const FILTERS: { value: 'all' | 'court' | 'voluntary'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'court', label: 'Court-ordered' },
  { value: 'voluntary', label: 'Voluntary' },
];

function ProgressBar({ pct }: { pct: number }) {
  const clipped = Math.min(100, pct);
  const color = pct >= 100 ? '#007536' : pct >= 60 ? '#5a8f3a' : pct >= 30 ? '#835400' : '#ba1a1a';
  return (
    <div className="w-24 bg-bg-surface-elevated rounded-full h-1.5 overflow-hidden shrink-0">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${clipped}%`, backgroundColor: color }} />
    </div>
  );
}

/** Shared tracks so header + rows size the same columns (auto grids drift apart). */
const USER_TABLE_COLS =
  'lg:grid-cols-[1.5fr_7.5rem_6.5rem_4.5rem_11rem_7.5rem_4.5rem]';

export function UsersClientShell({
  users,
  initialFilter,
}: {
  users: UserRow[];
  initialFilter: 'all' | 'court' | 'voluntary';
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'court' && !u.courtOrdered) return false;
      if (filter === 'voluntary' && u.courtOrdered) return false;
      if (!needle) return true;
      return u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle);
    });
  }, [users, q, filter]);

  const previewUser = previewId ? (users.find((u) => u.id === previewId) ?? null) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-sm mb-lg">
        <AdminSearchBar value={q} onChange={setQ} placeholder="Search by name or email…" className="w-full sm:w-64" />
        <div className="flex items-center gap-xs overflow-x-auto" role="group" aria-label="Filter by volunteer type">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                filter === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-body text-[14px] text-text-tertiary self-center">
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div
          className={`hidden lg:grid ${USER_TABLE_COLS} gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline`}
        >
          {['Name', 'Joined', 'Sessions', 'Hours', 'Type / Progress', 'Last Active', 'Actions'].map((col) => (
            <span
              key={col}
              className={`font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary ${
                col === 'Name' ? 'text-left' : 'text-center'
              }`}
            >
              {col}
            </span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="p-xl text-center">
            <p className="font-body text-[14px] text-text-tertiary">No users match this search.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {filtered.map((u) => (
              <li key={u.id}>
                <div
                  className={`grid grid-cols-1 ${USER_TABLE_COLS} gap-xs lg:gap-md lg:items-center px-lg py-md table-row-hover transition-colors`}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewId(u.id)}
                    className="text-left min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
                  >
                    <p className="font-body text-[14px] font-medium text-text-primary">{u.name}</p>
                    <p className="font-body text-[12px] text-text-tertiary">{u.email}</p>
                  </button>
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70">Joined </span>
                    {u.joinedAt ? formatDate(u.joinedAt) : '—'}
                  </span>
                  <span className="font-data text-[13px] font-medium text-text-primary lg:text-center">
                    {u.sessions} session{u.sessions !== 1 ? 's' : ''}
                  </span>
                  <span className="font-data text-[13px] font-medium text-primary lg:text-center">
                    {u.totalHours.toFixed(1)}h
                  </span>
                  {u.courtOrdered ? (
                    <div className="flex items-center gap-sm lg:justify-center min-w-0">
                      <CourtBadge />
                      {u.requiredHours != null && u.completedHours != null && (
                        <>
                          <ProgressBar pct={(u.completedHours / u.requiredHours) * 100} />
                          <span className="font-data text-[11px] text-text-tertiary whitespace-nowrap">
                            {u.completedHours.toFixed(1)}/{u.requiredHours}h
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="lg:flex lg:justify-center">
                      <span className="font-data text-[11px] font-semibold px-sm py-xs rounded-xs bg-[#f7fff1] text-primary whitespace-nowrap w-fit">
                        Voluntary
                      </span>
                    </div>
                  )}
                  <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap lg:text-center">
                    <span className="lg:hidden text-text-tertiary/70">Last active </span>
                    {u.lastActive ? formatDate(u.lastActive) : 'Never'}
                  </span>
                  <div className="lg:flex lg:justify-center">
                    <button
                      type="button"
                      onClick={() => setPreviewId(u.id)}
                      className="h-8 px-sm rounded-sm border border-border-outline text-text-tertiary font-data text-[11px] font-semibold hover:bg-bg-surface-elevated hover:text-text-primary transition-colors inline-flex items-center w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UserPreviewDrawer
        user={previewUser}
        open={previewId != null}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}
