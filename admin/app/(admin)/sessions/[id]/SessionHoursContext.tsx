'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { formatDuration } from '@/lib/format';

type SessionHoursContextValue = {
  adjustedHours: number | null;
  durationLabel: string;
  isAdjusted: boolean;
  setAdjustedHours: (hours: number) => void;
};

const SessionHoursContext = createContext<SessionHoursContextValue | null>(null);

export function SessionHoursProvider({
  durationSeconds,
  initialAdjustedHours,
  children,
}: {
  durationSeconds: number | null;
  initialAdjustedHours: number | null;
  children: ReactNode;
}) {
  const [adjustedHours, setAdjustedHoursState] = useState<number | null>(initialAdjustedHours);

  const setAdjustedHours = useCallback((hours: number) => {
    setAdjustedHoursState(hours);
  }, []);

  const value = useMemo(
    () => ({
      adjustedHours,
      durationLabel: formatDuration(durationSeconds, adjustedHours),
      isAdjusted: adjustedHours != null,
      setAdjustedHours,
    }),
    [adjustedHours, durationSeconds, setAdjustedHours],
  );

  return <SessionHoursContext.Provider value={value}>{children}</SessionHoursContext.Provider>;
}

export function useSessionHours() {
  const ctx = useContext(SessionHoursContext);
  if (!ctx) throw new Error('useSessionHours must be used within SessionHoursProvider');
  return ctx;
}

export function SessionDurationRow() {
  const { durationLabel, isAdjusted } = useSessionHours();
  return (
    <div>
      <dt className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase mb-xs">
        Duration
      </dt>
      <dd className="font-body text-base text-text-primary">
        {durationLabel}
        {isAdjusted ? (
          <span className="ml-sm font-data text-[11px] text-primary">(Adjusted by admin)</span>
        ) : null}
      </dd>
    </div>
  );
}
