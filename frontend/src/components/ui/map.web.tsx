import { createContext, use, type ReactNode } from "react";
import { View } from "react-native";

/**
 * Web platform stub for `map.tsx`. `@maplibre/maplibre-react-native` is a
 * native module (its `Camera`/`Marker` native components call
 * `codegenNativeComponent`, which `react-native-web` doesn't implement) —
 * importing the real file on web crashes at module-evaluation time, before
 * any runtime Platform check can run. Metro's `.web.tsx` resolution picks
 * this file instead for web bundles, so the native module is never
 * imported there.
 *
 * Consumers (see `LiveSessionMap.tsx`) are expected to check
 * `Platform.OS === 'web'` themselves and render a styled fallback rather
 * than relying on this stub to look like a map — it intentionally renders
 * nothing but its children's non-map content.
 */

type MapContextValue = {
  isLoaded: boolean;
  theme: "light" | "dark";
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
  const context = use(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}

type MapProps = {
  children?: ReactNode;
  center?: [number, number];
  zoom?: number;
  className?: string;
  showLoader?: boolean;
};

function Map({ children }: MapProps) {
  return (
    <MapContext value={{ isLoaded: true, theme: "light" }}>
      <View style={{ flex: 1 }}>{children}</View>
    </MapContext>
  );
}

function MapMarker(_props: { children?: ReactNode; [key: string]: unknown }) {
  return null;
}

function MapRoute(_props: { coordinates: Array<[number, number]>; [key: string]: unknown }) {
  return null;
}

function MapControls(_props: { [key: string]: unknown }) {
  return null;
}

function MapUserLocation(_props: { [key: string]: unknown }) {
  return null;
}

function MarkerContent({ children }: { children?: ReactNode; className?: string }) {
  return <View>{children}</View>;
}

function MarkerLabel({ children }: { children?: ReactNode; className?: string; classNameText?: string; position?: "top" | "bottom" }) {
  return <View>{children}</View>;
}

function MarkerPopup({ children }: { children?: ReactNode; className?: string; title?: string }) {
  return <View>{children}</View>;
}

function useCurrentPosition() {
  return { data: null, isLoading: false, error: null } as const;
}

const LocationManager = {
  requestPermissions: async () => false,
};

export {
  LocationManager,
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MapUserLocation,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  useCurrentPosition,
  useMap,
};
