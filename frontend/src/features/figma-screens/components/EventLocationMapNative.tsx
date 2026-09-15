import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { Map, MapMarker } from '@/components/ui/map';

import { EventLocationPinIcon } from './EventIcons';
import { colors } from '../tokens';
import type { MapCoordinate } from '../utils/openLocationInMaps';

type Props = {
  address: string;
  coordinate: MapCoordinate;
  onPress: () => void;
};

/** MapLibre branch — only loaded outside Expo Go / web. */
export function EventLocationMapNative({ address, coordinate, onPress }: Props) {
  return (
    <View style={s.mapWrap}>
      <Map center={[coordinate.longitude, coordinate.latitude]} zoom={14} showLoader>
        {/* Anchor at the pin's tip (bottom-center) so it points at the coordinate. */}
        <MapMarker longitude={coordinate.longitude} latitude={coordinate.latitude} anchor={{ x: 0.5, y: 1 }}>
          <View style={s.markerShadow}>
            <EventLocationPinIcon size={32} />
          </View>
        </MapMarker>
      </Map>
      {/* Transparent overlay so taps open Maps (MapLibre swallows gestures). */}
      <AnimatedPressable
        scaleTo={1}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`Open ${address} in Maps`}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const s = StyleSheet.create({
  mapWrap: {
    width: '100%',
    aspectRatio: 382 / 203,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.chipSelectedBg,
  },
  markerShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
});
