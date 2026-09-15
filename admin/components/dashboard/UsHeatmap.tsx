'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import {
  COOK_COUNTY_FIPS,
  heatFill,
  heatText,
  neighborhoodsForCounty,
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

type Drill =
  | { level: 'nation' }
  | { level: 'state'; fips: string; name: string }
  | { level: 'county'; fips: string; name: string; stateFips: string; stateName: string };

type Props = {
  activity: GeoActivityBundle;
  periodLabel: string;
  isMock?: boolean;
};

const MAP_W = 640;
const MAP_H = 400;

function statsMap(rows: GeoUnitStats[]): Map<string, GeoUnitStats> {
  return new Map(rows.map((r) => [r.id, r]));
}

function emptyStats(id: string, name: string): GeoUnitStats {
  return { id, name, sessionCount: 0, hours: 0, underReview: 0 };
}

export function UsHeatmap({ activity, periodLabel, isMock = false }: Props) {
  const [drill, setDrill] = useState<Drill>({ level: 'nation' });
  const [statesFc, setStatesFc] = useState<FeatureCollection | null>(null);
  const [countiesFc, setCountiesFc] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
  const byCounty = useMemo(() => statsMap(activity.byCounty), [activity.byCounty]);
  const byNeighborhood = useMemo(
    () => statsMap(activity.byNeighborhood),
    [activity.byNeighborhood],
  );

  const stateCounties = useMemo(() => {
    if (!countiesFc || drill.level === 'nation') return null;
    const stateFips = drill.level === 'state' ? drill.fips : drill.stateFips;
    return filterCountiesByState(countiesFc, stateFips);
  }, [countiesFc, drill]);

  const nationPath = useMemo(() => {
    if (!statesFc) return null;
    return makePathForCollection(statesFc, MAP_W, MAP_H);
  }, [statesFc]);

  const countyPath = useMemo(() => {
    if (!stateCounties || stateCounties.features.length === 0) return null;
    return makeRegionalPathForCollection(stateCounties, MAP_W, MAP_H);
  }, [stateCounties]);

  const countyBubbles = useMemo(() => {
    if (!stateCounties || !countyPath || drill.level !== 'state') return [];
    return countyBubblesForState(stateCounties, countyPath.projection, byCounty);
  }, [stateCounties, countyPath, byCounty, drill.level]);

  const activeStatsList: GeoUnitStats[] = useMemo(() => {
    if (drill.level === 'nation') {
      return [...activity.byState].sort((a, b) => b.sessionCount - a.sessionCount);
    }
    if (drill.level === 'state') {
      return activity.byCounty
        .filter((c) => c.id.startsWith(drill.fips))
        .sort((a, b) => b.sessionCount - a.sessionCount);
    }
    const neigh = neighborhoodsForCounty(drill.fips);
    return neigh
      .map((n) => byNeighborhood.get(n.id) ?? emptyStats(n.id, n.name))
      .sort((a, b) => b.sessionCount - a.sessionCount);
  }, [activity.byState, activity.byCounty, byNeighborhood, drill]);

  const maxCount = Math.max(1, ...activeStatsList.map((s) => s.sessionCount));

  const hoveredStats = useMemo(() => {
    if (!hoveredId) return null;
    return (
      byState.get(hoveredId) ??
      byCounty.get(hoveredId) ??
      byNeighborhood.get(hoveredId) ??
      countyBubbles.find((b) => b.id === hoveredId) ??
      null
    );
  }, [hoveredId, byState, byCounty, byNeighborhood, countyBubbles]);

  const title =
    drill.level === 'nation'
      ? 'United States activity'
      : drill.level === 'state'
        ? `${drill.name} counties`
        : `${drill.name} neighborhoods`;

  const subtitle =
    drill.level === 'nation'
      ? `State heat · ${periodLabel}`
      : drill.level === 'state'
        ? `County bubble heat · ${periodLabel}`
        : `Neighborhood tile heat · ${periodLabel}`;

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
            {drill.level !== 'nation' && (
              <>
                <span className="text-text-tertiary" aria-hidden>
                  /
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDrill({
                      level: 'state',
                      fips: drill.level === 'state' ? drill.fips : drill.stateFips,
                      name: drill.level === 'state' ? drill.name : drill.stateName,
                    })
                  }
                  className={`min-h-9 px-xs rounded-sm ${
                    drill.level === 'state'
                      ? 'font-semibold text-text-primary'
                      : 'text-primary hover:underline'
                  }`}
                >
                  {drill.level === 'state' ? drill.name : drill.stateName}
                </button>
              </>
            )}
            {drill.level === 'county' && (
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
          ) : drill.level === 'county' ? (
            <NeighborhoodMap
              countyFips={drill.fips}
              byNeighborhood={byNeighborhood}
              maxCount={maxCount}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
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
              aria-label={`${drill.name} county bubble heat map. Select a county to see neighborhoods.`}
            >
              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#fcf9f8" />
              {/* Faint county outlines for geography context */}
              {stateCounties.features.map((raw) => {
                const f = raw as UsGeoFeature;
                const id = fipsId(f);
                const d = countyPath.path(f as never) ?? '';
                if (!d) return null;
                const name = featureName(f, id);
                const hovered = hoveredId === id;
                return (
                  <path
                    key={`outline-${id}`}
                    d={d}
                    fill={hovered ? '#e8f5ec' : '#f6f3f2'}
                    stroke={hovered ? '#007536' : '#bdcaba'}
                    strokeWidth={hovered ? 1.2 : 0.5}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      setDrill({
                        level: 'county',
                        fips: id,
                        name,
                        stateFips: drill.fips,
                        stateName: drill.name,
                      })
                    }
                  >
                    <title>{name}</title>
                  </path>
                );
              })}
              {/* Activity bubbles at county centroids — clearer than flat choropleth when sparse */}
              {[...countyBubbles]
                .sort((a, b) => a.sessionCount - b.sessionCount)
                .map((b) => {
                  const intensity = b.sessionCount / maxCount;
                  const hovered = hoveredId === b.id;
                  const r =
                    b.sessionCount <= 0
                      ? 0
                      : Math.max(6, Math.min(28, 6 + Math.sqrt(intensity) * 22));
                  if (r <= 0) return null;
                  return (
                    <g key={`bubble-${b.id}`}>
                      <circle
                        cx={b.cx}
                        cy={b.cy}
                        r={r + (hovered ? 2 : 0)}
                        fill={heatFill(Math.max(0.2, intensity))}
                        fillOpacity={0.88}
                        stroke={hovered ? '#1c1b1b' : '#ffffff'}
                        strokeWidth={hovered ? 2 : 1.25}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredId(b.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() =>
                          setDrill({
                            level: 'county',
                            fips: b.id,
                            name: b.name,
                            stateFips: drill.fips,
                            stateName: drill.name,
                          })
                        }
                      >
                        <title>
                          {b.name}: {b.sessionCount} session{b.sessionCount === 1 ? '' : 's'}
                        </title>
                      </circle>
                      {b.sessionCount > 0 && r >= 12 && (
                        <text
                          x={b.cx}
                          y={b.cy + 3}
                          textAnchor="middle"
                          className="pointer-events-none"
                          fill={heatText(Math.max(0.2, intensity))}
                          fontSize="10"
                          fontFamily="var(--font-ibm-plex-sans), monospace"
                          fontWeight="700"
                        >
                          {b.sessionCount}
                        </text>
                      )}
                    </g>
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
          {isMock && (
            <p className="mt-xs font-body text-[12px] text-text-tertiary">
              Preview locations — live sessions default to Illinois / Cook County until GPS geocoding ships.
            </p>
          )}
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-border-outline p-md sm:p-lg">
          <p
            id="us-heatmap-rank-label"
            className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-sm"
          >
            {drill.level === 'nation'
              ? 'Top states'
              : drill.level === 'state'
                ? 'Top counties'
                : 'Neighborhoods'}
          </p>
          {activeStatsList.every((s) => s.sessionCount === 0) ? (
            <p className="font-body text-[13px] text-text-tertiary">
              No sessions in this area for the selected period.
            </p>
          ) : (
            <ul className="flex flex-col gap-xs max-h-[360px] overflow-y-auto" role="list" aria-labelledby="us-heatmap-rank-label">
              {activeStatsList
                .filter((s) => s.sessionCount > 0 || drill.level === 'county')
                .slice(0, drill.level === 'county' ? 20 : 12)
                .map((row, i) => {
                  const selected =
                    (drill.level === 'state' && drill.fips === row.id) ||
                    (drill.level === 'county' && drill.fips === row.id);
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (drill.level === 'nation') {
                            setDrill({
                              level: 'state',
                              fips: row.id,
                              name: row.name,
                            });
                          } else if (drill.level === 'state') {
                            setDrill({
                              level: 'county',
                              fips: row.id,
                              name: row.name,
                              stateFips: drill.fips,
                              stateName: drill.name,
                            });
                          } else {
                            setHoveredId(row.id);
                          }
                        }}
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
                if (drill.level === 'county') {
                  setDrill({
                    level: 'state',
                    fips: drill.stateFips,
                    name: drill.stateName,
                  });
                } else {
                  setDrill({ level: 'nation' });
                }
                setHoveredId(null);
              }}
              className="mt-md min-h-11 font-data text-[12px] font-semibold text-primary hover:underline underline-offset-2"
            >
              {drill.level === 'county' ? `Back to ${drill.stateName}` : 'Back to United States'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function NeighborhoodMap({
  countyFips,
  byNeighborhood,
  maxCount,
  hoveredId,
  setHoveredId,
}: {
  countyFips: string;
  byNeighborhood: Map<string, GeoUnitStats>;
  maxCount: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const neighborhoods = neighborhoodsForCounty(countyFips);

  if (neighborhoods.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border-outline bg-bg-surface-elevated px-md py-xl text-center">
        <p className="font-body text-[14px] text-text-tertiary">
          Neighborhood breakdown is available for Cook County, IL
          {countyFips !== COOK_COUNTY_FIPS ? ' — pick Cook County to explore.' : '.'}
        </p>
      </div>
    );
  }

  const tiles = neighborhoods
    .map((n) => {
      const stat = byNeighborhood.get(n.id);
      return {
        id: n.id,
        name: n.name,
        sessionCount: stat?.sessionCount ?? 0,
        hours: stat?.hours ?? 0,
        underReview: stat?.underReview ?? 0,
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name));

  const totalSessions = tiles.reduce((sum, t) => sum + t.sessionCount, 0);

  return (
    <div
      className="flex flex-col gap-md"
      role="img"
      aria-label="Neighborhood tile heat map for this county"
    >
      {/* Proportional heat strip — share of county sessions */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full border border-border-outline"
        aria-hidden
      >
        {totalSessions === 0 ? (
          <span className="flex-1 bg-[#f0eded]" />
        ) : (
          tiles
            .filter((t) => t.sessionCount > 0)
            .map((t) => (
              <button
                key={`strip-${t.id}`}
                type="button"
                title={`${t.name}: ${t.sessionCount}`}
                className="h-full min-w-[4px] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                style={{
                  flexGrow: t.sessionCount,
                  backgroundColor: heatFill(t.sessionCount / maxCount),
                }}
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setHoveredId(t.id)}
              />
            ))
        )}
      </div>

      {/* Heat tiles — size emphasis via min-height + count, color via intensity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
        {tiles.map((t) => {
          const intensity = t.sessionCount / maxCount;
          const hovered = hoveredId === t.id;
          const fill = heatFill(t.sessionCount > 0 ? Math.max(0.15, intensity) : 0);
          const textColor = heatText(t.sessionCount > 0 ? Math.max(0.15, intensity) : 0);
          const minH = t.sessionCount > 0 ? 88 + Math.round(intensity * 36) : 72;

          return (
            <button
              key={t.id}
              type="button"
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(t.id)}
              aria-pressed={hovered}
              aria-label={`${t.name}, ${t.sessionCount} sessions, ${t.hours.toFixed(1)} hours`}
              className={`rounded-sm border px-sm py-sm text-left transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                hovered ? 'border-[#1c1b1b] shadow-bar-top ring-1 ring-[#1c1b1b]/20' : 'border-border-outline'
              }`}
              style={{ backgroundColor: fill, minHeight: minH }}
            >
              <p
                className="font-data text-[10px] uppercase tracking-[0.6px] leading-tight mb-xs truncate"
                style={{ color: textColor, opacity: 0.85 }}
              >
                {t.name}
              </p>
              <p
                className="font-data text-[28px] leading-[32px] font-semibold tabular-nums"
                style={{ color: textColor }}
              >
                {t.sessionCount}
              </p>
              <p className="font-data text-[11px] mt-xs" style={{ color: textColor, opacity: 0.8 }}>
                {t.hours.toFixed(1)}h
                {t.underReview > 0 ? ` · ${t.underReview} waiting` : ''}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
