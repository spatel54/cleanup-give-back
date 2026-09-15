import { useEffect, useState } from 'react';

import { isApiConfigured } from '@/lib/api';
import { getSession } from '@/lib/sessionsApi';

import { getCachedCompletedSession } from '../completedSessionCache';
import { toRouteCoordinates, type RouteCoordinate } from '../utils/geo';

function resolveCachedRoute(sessionId?: string): RouteCoordinate[] {
  const cached = getCachedCompletedSession(sessionId);
  return cached?.routeCoordinates ?? [];
}

/** Resolves a session walking path from local cache or the sessions API. */
export function useSessionRouteCoordinates(sessionId?: string): RouteCoordinate[] {
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>(() =>
    resolveCachedRoute(sessionId),
  );

  useEffect(() => {
    const cachedRoute = resolveCachedRoute(sessionId);
    if (cachedRoute.length >= 2) {
      setRouteCoordinates(cachedRoute);
      return;
    }

    if (!sessionId) {
      setRouteCoordinates([]);
      return;
    }

    if (!isApiConfigured) {
      setRouteCoordinates(cachedRoute);
      return;
    }

    let cancelled = false;

    void getSession(sessionId)
      .then((data) => {
        if (cancelled) {
          return;
        }

        const route = toRouteCoordinates(data?.session.route);
        setRouteCoordinates(route.length >= 2 ? route : cachedRoute);
      })
      .catch((error) => {
        console.warn('[sessions] route fetch failed:', error);
        if (!cancelled) {
          setRouteCoordinates(cachedRoute);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return routeCoordinates;
}
