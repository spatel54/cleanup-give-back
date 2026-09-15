import { useEffect, useRef } from 'react';

import { useMap } from '@/components/ui/map';

import type { RouteCoordinate } from '../utils/geo';

type Props = {
  routeCoordinates: RouteCoordinate[];
  recenterToken: number;
};

/** Recenters the session-detail / confirmation replay map when the location pin is tapped. */
export function SessionRouteMapPreviewCamera({ routeCoordinates, recenterToken }: Props) {
  const { cameraRef, isLoaded } = useMap();
  const lastRecenterToken = useRef(recenterToken);

  useEffect(() => {
    if (!isLoaded || !cameraRef.current) {
      return;
    }

    if (recenterToken === lastRecenterToken.current) {
      return;
    }
    lastRecenterToken.current = recenterToken;

    if (routeCoordinates.length === 0) {
      return;
    }

    if (routeCoordinates.length === 1) {
      cameraRef.current.flyTo({
        center: routeCoordinates[0],
        zoom: 15,
        duration: 700,
        bearing: 0,
      });
      return;
    }

    const lngs = routeCoordinates.map((c) => c[0]);
    const lats = routeCoordinates.map((c) => c[1]);
    cameraRef.current.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      {
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        duration: 700,
        bearing: 0,
      },
    );
  }, [cameraRef, isLoaded, recenterToken, routeCoordinates]);

  return null;
}
