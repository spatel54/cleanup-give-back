import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../tokens';
import {
  MAP_LAYER_OPTIONS,
  type MapLayerType,
} from '../utils/mapStyles';

type Props = {
  currentLayer: MapLayerType;
  onSelect: (layer: MapLayerType) => void;
  onClose: () => void;
};

/** Layer-type menu anchored above the live tracker map tools control. */
export function MapLayerPicker({ currentLayer, onSelect, onClose }: Props) {
  return (
    <View style={styles.menu} accessibilityRole="menu">
      {MAP_LAYER_OPTIONS.map((option) => {
        const isSelected = option.id === currentLayer;

        return (
          <AnimatedPressable
            key={option.id}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => {
              onSelect(option.id);
              onClose();
            }}
            accessibilityRole="menuitem"
            accessibilityLabel={`${option.label} map${isSelected ? ', selected' : ''}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    right: 0,
    bottom: '100%',
    marginBottom: 10,
    minWidth: 132,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    backgroundColor: colors.textOnPrimary,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: colors.bgApp,
  },
  optionText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
