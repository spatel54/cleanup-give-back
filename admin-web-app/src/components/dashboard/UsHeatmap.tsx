/** Ported verbatim from `admin/components/dashboard/UsHeatmap.tsx` - interactive nation → state → county drill-down over live TopoJSON (neighborhood/tract tier removed). */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FeatureCollection } from 'geojson';
import {
  heatFill,
  STATE_FIPS_NAME,
  type GeoActivityBundle,
  type GeoUnitStats,
} from '@/lib/us-heatmap';
import {
  countyBubblesForState,
  filterCountiesByState,
  fipsId,
  loadUsCounties,
  loadUsStates,
  makePathForCollection,
  makeRegionalPathForCollection,
  type UsGeoFeature,
} from '@/lib/us-geo';

type Drill = { level: 'nation' } | { level: 'state'; fips: string; name: string };

type Props = {
  activity: GeoActivityBundle;
  periodLabel: string;
};

const MAP_W = 640;
const MAP_H = 400;

function statsMap(rows: GeoUnitStats[]): Map<string, GeoUnitStats> {
  return new Map(rows.map((r) => [r.id, r]));
}

export function UsHeatmap({ activity, periodLabel }: Props) {
  const [drill, setDrill] = useState<Drill>({ level: 'nation' });
  const [statesFc, setStatesFc] = useState<FeatureCollection | null>(null);
  const [countiesFc, setCountiesFc] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  /** Viewport-relative - the suggestion dropdown portals to `document.body` so it isn't
   * clipped by the card's `overflow-hidden` (see the `<section>` wrapping this component). */
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  // Clears any in-progress search when the drilled-into level changes underneath it -
  // adjusted during render (React's recommended pattern) rather than a dedicated effect.
  const [searchDrill, setSearchDrill] = useState(drill);
  if (searchDrill !== drill) {
    setSearchDrill(drill);
    setSearch('');
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [states, counties] = await Promise.all([loadUsStates(), loadUsCounties()]);
        if (cancelled) return;
        setStatesFc(states);
        setCountiesFc(counties);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Could not load map');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byState = useMemo(() => statsMap(activity.byState), [activity.byState]);
  const byCountyRaw = useMemo(() => statsMap(activity.byCounty), [activity.byCounty]);

  const stateCounties = useMemo(() => {
    if (!countiesFc || drill.level === 'nation') return null;
    return filterCountiesByState(countiesFc, drill.fips);
  }, [countiesFc, drill]);

  const nationPath = useMemo(() => {
    if (!statesFc) return null;
    return makePathForCollection(statesFc, MAP_W, MAP_H);
  }, [statesFc]);

  const countyPath = useMemo(() => {
    if (!stateCounties || stateCounties.features.length === 0) return null;
    return makeRegionalPathForCollection(stateCounties, MAP_W, MAP_H);
  }, [stateCounties]);

  /** Real county names from TopoJSON, keyed by FIPS - `activity.byCounty` only carries a
   * `County <fips>` placeholder name (`buildGeoActivity` has no geometry to resolve from). */
  const countyNameById = useMemo(() => {
    const map = new Map<string, string>();
    if (!stateCounties) return map;
    for (const raw of stateCounties.features) {
      const f = raw as UsGeoFeature;
      const id = fipsId(f);
      map.set(id, featureName(f, id));
    }
    return map;
  }, [stateCounties]);

  const byCounty = useMemo(() => {
    const map = new Map(byCountyRaw);
    for (const [id, stat] of map) {
      const realName = countyNameById.get(id);
      if (realName) map.set(id, { ...stat, name: realName });
    }
    return map;
  }, [byCountyRaw, countyNameById]);

  const countyBubbles = useMemo(() => {
    if (!stateCounties || !countyPath || drill.level !== 'state') return [];
    return countyBubblesForState(stateCounties, countyPath.projection, byCounty);
  }, [stateCounties, countyPath, byCounty, drill.level]);

  const activeStatsList: GeoUnitStats[] = useMemo(() => {
    if (drill.level === 'nation') {
      return [...activity.byState].sort((a, b) => b.sessionCount - a.sessionCount);
    }
    // `byCounty` already carries real TopoJSON-resolved names (see above).
    return [...byCounty.values()]
      .filter((c) => c.id.startsWith(drill.fips))
      .sort((a, b) => b.sessionCount - a.sessionCount);
  }, [activity.byState, byCounty, drill]);

  const maxCount = Math.max(1, ...activeStatsList.map((s) => s.sessionCount));

  // Search filters the sidebar list only - maxCount (and therefore heat color) stays
  // anchored to the full unfiltered set so intensity doesn't jump around while typing.
  const filteredStatsList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeStatsList;
    return activeStatsList.filter((row) => row.name.toLowerCase().includes(q));
  }, [activeStatsList, search]);

  const searchPlaceholder = drill.level === 'nation' ? 'Search states' : 'Search counties';

  /** Drills into (or, at the deepest level, highlights) a row - shared by the ranked
   * list and the type-ahead suggestion dropdown so both select the same way. */
  function selectStatRow(row: GeoUnitStats) {
    if (drill.level === 'nation') {
      setDrill({ level: 'state', fips: row.id, name: row.name });
    } else {
      setHoveredId(row.id);
    }
    setSearch('');
    setSearchFocused(false);
  }

  const hoveredStats = useMemo(() => {
    if (!hoveredId) return null;
    return byState.get(hoveredId) ?? byCounty.get(hoveredId) ?? countyBubbles.find((b) => b.id === hoveredId) ?? null;
  }, [hoveredId, byState, byCounty, countyBubbles]);

  const title = drill.level === 'nation' ? 'United States activity' : `${drill.name} counties`;

  const subtitle = drill.level === 'nation' ? `State heat · ${periodLabel}` : `County heat · ${periodLabel}`;

  function featureName(f: UsGeoFeature, fallbackFips: string): string {
    return f.properties?.name ?? STATE_FIPS_NAME[fallbackFips] ?? fallbackFips;
  }

  return (
    <section
      className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      aria-labelledby="us-heatmap-heading"
    >
      <div className="px-lg py-md border-b border-border-outline flex flex-col sm:flex-row sm:items-start sm:justify-between gap-sm">
        <div className="min-w-0">
          <h2 id="us-heatmap-heading" className="font-heading text-[18px] leading-[26px] text-text-primary">
            {title}
          </h2>
          <p className="font-body text-[13px] text-text-tertiary">{subtitle}</p>
          <nav aria-label="Map location" className="mt-sm flex flex-wrap items-center gap-xs font-data text-[12px]">
            <button
              type="button"
              onClick={() => setDrill({ level: 'nation' })}
              className={`min-h-9 px-xs rounded-sm ${
                drill.level === 'nation'
                  ? 'font-semibold text-text-primary'
                  : 'text-primary hover:underline'
              }`}
            >
              United States
            </button>
            {drill.level === 'state' && (
              <>
                <span className="text-text-tertiary" aria-hidden>
                  /
                </span>
                <span className="min-h-9 px-xs inline-flex items-center font-semibold text-text-primary">
                  {drill.name}
                </span>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-sm shrink-0" aria-hidden>
          <span className="font-data text-[10px] uppercase text-text-tertiary">Low</span>
          <div className="flex h-2 w-28 rounded-full overflow-hidden border border-border-outline">
            {['#f0eded', '#dcefe0', '#7fb089', '#3d8f5c', '#007536'].map((c) => (
              <span key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="font-data text-[10px] uppercase text-text-tertiary">High</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-0">
        <div className="p-md sm:p-lg bg-bg-app/40">
          {loadError ? (
            <p className="font-body text-[14px] text-[#ba1a1a]" role="alert">
              {loadError}
            </p>
          ) : !statesFc || (drill.level === 'state' && !countyPath) ? (
            <div className="h-[240px] rounded-sm bg-bg-surface-elevated animate-pulse" aria-hidden />
          ) : drill.level === 'nation' && nationPath ? (
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="w-full h-auto max-h-[400px]"
              role="img"
              aria-label="United States heat map. Select a state from the list or map."
            >
              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#fcf9f8" />
              {statesFc.features.map((raw) => {
                const f = raw as UsGeoFeature;
                const id = fipsId(f);
                const stat = byState.get(id);
                const count = stat?.sessionCount ?? 0;
                const intensity = count / maxCount;
                const hovered = hoveredId === id;
                const d = nationPath.path(f as never) ?? '';
                if (!d) return null;
                return (
                  <path
                    key={id}
                    d={d}
                    fill={heatFill(intensity)}
                    stroke={hovered ? '#1c1b1b' : '#ffffff'}
                    strokeWidth={hovered ? 1.5 : 0.6}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      setDrill({
                        level: 'state',
                        fips: id,
                        name: featureName(f, id),
                      })
                    }
                  >
                    <title>
                      {featureName(f, id)}: {count} session{count === 1 ? '' : 's'}
                    </title>
                  </path>
                );
              })}
            </svg>
          ) : drill.level === 'state' && countyPath && stateCounties ? (
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="w-full h-auto max-h-[400px]"
              role="img"
              aria-label={`${drill.name} county heat map.`}
            >
              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#fcf9f8" />
              {/* Every county in the state, filled by session-count intensity - same choropleth
               * treatment as the nation view, so a county with zero sessions still renders its
               * real shape (just unfilled) instead of only appearing once it has data. */}
              {stateCounties.features.map((raw) => {
                const f = raw as UsGeoFeature;
                const id = fipsId(f);
                const d = countyPath.path(f as never) ?? '';
                if (!d) return null;
                const name = featureName(f, id);
                const stat = byCounty.get(id);
                const count = stat?.sessionCount ?? 0;
                const intensity = count / maxCount;
                const hovered = hoveredId === id;
                return (
                  <path
                    key={id}
                    d={d}
                    fill={heatFill(intensity)}
                    stroke={hovered ? '#1c1b1b' : '#ffffff'}
                    strokeWidth={hovered ? 1.5 : 0.6}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setHoveredId(id)}
                  >
                    <title>
                      {name}: {count} session{count === 1 ? '' : 's'}
                    </title>
                  </path>
                );
              })}
            </svg>
          ) : null}

          {hoveredStats && (
            <p className="mt-sm font-body text-[13px] text-text-tertiary" aria-live="polite">
              <span className="font-semibold text-text-primary">{hoveredStats.name}</span>
              {' · '}
              {hoveredStats.sessionCount} session{hoveredStats.sessionCount === 1 ? '' : 's'}
              {' · '}
              {hoveredStats.hours.toFixed(1)}h
              {hoveredStats.underReview > 0 ? ` · ${hoveredStats.underReview} under review` : ''}
            </p>
          )}
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-border-outline p-md sm:p-lg">
          <p
            id="us-heatmap-rank-label"
            className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-sm"
          >
            {drill.level === 'nation' ? 'Top states' : 'Top counties'}
          </p>
          {activeStatsList.length > 0 && (
            <div className="relative mb-sm">
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownRect({ top: rect.bottom, left: rect.left, width: rect.width });
                  setSearchFocused(true);
                }}
                onBlur={() => setSearchFocused(false)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                role="combobox"
                aria-expanded={searchFocused && search.trim().length > 0}
                aria-controls="us-heatmap-suggestions"
                autoComplete="off"
                className="w-full h-11 px-md rounded-full border border-border-outline bg-bg-surface font-body text-[13px] text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
              {searchFocused &&
                search.trim().length > 0 &&
                dropdownRect &&
                typeof document !== 'undefined' &&
                createPortal(
                  <ul
                    id="us-heatmap-suggestions"
                    role="listbox"
                    aria-label={`${searchPlaceholder} suggestions`}
                    // Portalled to <body> and positioned fixed from the input's own rect -
                    // the card this input lives in has `overflow-hidden` (for the map's
                    // rounded corners), which would otherwise clip a dropdown positioned
                    // relative to an in-card ancestor.
                    style={{ top: dropdownRect.top + 4, left: dropdownRect.left, width: dropdownRect.width }}
                    className="fixed z-[100] max-h-72 overflow-y-auto rounded-md border border-border-outline bg-bg-app shadow-bar-top"
                  >
                    {filteredStatsList.length === 0 ? (
                      <li className="px-md py-sm font-body text-[13px] text-text-tertiary">
                        No matches for &ldquo;{search}&rdquo;.
                      </li>
                    ) : (
                      filteredStatsList.slice(0, 8).map((row) => (
                        <li key={row.id}>
                          <button
                            type="button"
                            // onMouseDown (not onClick) + preventDefault stops the input
                            // from blurring (and the dropdown closing) before the click lands.
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectStatRow(row);
                            }}
                            className="w-full min-h-11 px-md py-xs flex items-center gap-sm text-left hover:bg-bg-surface-elevated transition-colors"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: heatFill(row.sessionCount / maxCount) }}
                              aria-hidden
                            />
                            <span className="font-body text-[13px] font-medium text-text-primary flex-1 truncate">
                              {row.name}
                            </span>
                            <span className="font-data text-[12px] text-text-tertiary shrink-0">
                              {row.sessionCount} session{row.sessionCount === 1 ? '' : 's'}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>,
                  document.body,
                )}
            </div>
          )}
          {activeStatsList.length === 0 ? (
            <p className="font-body text-[13px] text-text-tertiary">
              No sessions in this area for the selected period.
            </p>
          ) : filteredStatsList.length === 0 ? (
            <p className="font-body text-[13px] text-text-tertiary">No matches for &ldquo;{search}&rdquo;.</p>
          ) : (
            <ul className="flex flex-col gap-xs max-h-[360px] overflow-y-auto" role="list" aria-labelledby="us-heatmap-rank-label">
              {filteredStatsList.slice(0, 12).map((row, i) => {
                const selected = drill.level === 'state' && drill.fips === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => selectStatRow(row)}
                      aria-pressed={selected || hoveredId === row.id}
                      className={`w-full min-h-11 px-sm py-xs rounded-sm flex items-center gap-sm text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                        selected || hoveredId === row.id
                          ? 'bg-[#f7fff1] border border-primary/30'
                          : 'hover:bg-bg-surface-elevated border border-transparent'
                      }`}
                    >
                      <span className="font-data text-[12px] text-text-tertiary w-4" aria-hidden>
                        {i + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: heatFill(row.sessionCount / maxCount) }}
                        aria-hidden
                      />
                      <span className="font-body text-[13px] font-medium text-text-primary flex-1 truncate">
                        {row.name}
                      </span>
                      <span className="font-data text-[12px] text-text-tertiary shrink-0">
                        {row.sessionCount}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {drill.level !== 'nation' && (
            <button
              type="button"
              onClick={() => {
                setDrill({ level: 'nation' });
                setHoveredId(null);
              }}
              className="mt-md min-h-11 font-data text-[12px] font-semibold text-primary hover:underline underline-offset-2"
            >
              Back to United States
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
