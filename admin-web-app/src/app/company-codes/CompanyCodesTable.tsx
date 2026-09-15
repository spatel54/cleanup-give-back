'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteCompanyCodes,
  type CompanyCodeRow,
} from '@/actions/companyCodes';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/mock-data';
import { DeleteCompanyCodeButton } from './CompanyCodeActions';

const STATUS_CLASSNAME: Record<'active' | 'used', string> = {
  active: 'bg-[#f7fff1] text-[#007536] border-[#007536]',
  used: 'bg-[#f6f3f2] text-[#3e4a3d] border-[#bdcaba]',
};

function matchesQuery(row: CompanyCodeRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.code,
    row.status,
    row.used_by_email ?? '',
    row.used_by ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function CompanyCodesTable({ codes }: { codes: CompanyCodeRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  const filteredCodes = useMemo(
    () => codes.filter((row) => matchesQuery(row, query)),
    [codes, query],
  );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setBulkError(null);
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const nextFiltered = new Set(
      codes.filter((row) => matchesQuery(row, value)).map((row) => row.id),
    );
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (nextFiltered.has(id)) next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        count === 1
          ? 'Delete this company code?'
          : `Delete ${count} company codes? This cannot be undone.`,
      )
    ) {
      return;
    }

    const ids = Array.from(selectedIds);
    setBulkError(null);
    startBulkTransition(async () => {
      try {
        await deleteCompanyCodes(ids);
        exitSelectMode();
        router.refresh();
      } catch (caught) {
        setBulkError(caught instanceof Error ? caught.message : 'Could not delete codes');
      }
    });
  };

  const colCount = selectMode ? 6 : 5;
  const emptyMessage =
    codes.length === 0
      ? 'No company codes yet. Generate one to get started.'
      : 'No codes match your search.';

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-sm mb-md min-h-11">
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by code or email…"
          aria-label="Search company codes"
          className="w-full sm:w-64 sm:max-w-full h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-body text-[13px] text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
        <div className="flex flex-wrap items-center justify-end gap-sm ml-auto">
          {selectMode ? (
            <>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkPending || selectedIds.size === 0}
                className="min-h-9 min-w-0"
              >
                {bulkPending
                  ? 'Deleting…'
                  : `Delete All (${selectedIds.size})`}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={exitSelectMode}
                disabled={bulkPending}
                className="min-h-9 min-w-0 bg-[#e8e8e8] text-[#3e4a3d] border-[#bdcaba] hover:bg-[#dcdcdc]"
              >
                Cancel
              </Button>
              {bulkError ? (
                <span className="font-body text-[12px] text-[#ba1a1a]" role="alert">
                  {bulkError}
                </span>
              ) : null}
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelectMode(true)}
              disabled={codes.length === 0}
              className="min-h-9 min-w-0"
            >
              Select
            </Button>
          )}
        </div>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-outline bg-bg-surface-elevated">
                {selectMode ? <th className="px-lg py-sm w-11" aria-label="Select" /> : null}
                {(selectMode
                  ? ['Code', 'Status', 'Used by', 'Created']
                  : ['Code', 'Status', 'Used by', 'Created', 'Actions']
                ).map((heading) => (
                  <th
                    key={heading}
                    className="px-lg py-sm font-data text-[12px] font-medium tracking-[0.96px] text-text-tertiary uppercase whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-outline">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-lg py-xl text-center font-body text-base text-text-tertiary"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
              {filteredCodes.map((row) => {
                const selected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors align-middle ${
                      selectMode && selected
                        ? 'bg-[#f7fff1]/70'
                        : 'hover:bg-bg-surface-elevated'
                    }`}
                  >
                    {selectMode ? (
                      <td className="px-lg py-md">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(row.id)}
                          aria-label={`Select code ${row.code}`}
                          className="w-4 h-4 accent-primary"
                        />
                      </td>
                    ) : null}
                    <td className="px-lg py-md font-data text-[15px] font-semibold tracking-[0.12em] text-text-primary whitespace-nowrap">
                      {row.code}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[12px] font-semibold leading-[16px] whitespace-nowrap ${STATUS_CLASSNAME[row.status]}`}
                      >
                        {row.status === 'active' ? 'Active' : 'Used'}
                      </span>
                    </td>
                    <td className="px-lg py-md">
                      {row.status === 'used' ? (
                        <>
                          <span className="font-body text-[14px] text-text-primary">
                            {row.used_by_email ?? row.used_by ?? '-'}
                          </span>
                          {row.used_at ? (
                            <p className="font-data text-[11px] text-text-tertiary">
                              {formatDateTime(row.used_at)}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="font-body text-[14px] text-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-lg py-md font-body text-[13px] text-text-tertiary whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                    </td>
                    {!selectMode ? (
                      <td className="px-lg py-md">
                        <DeleteCompanyCodeButton codeId={row.id} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
