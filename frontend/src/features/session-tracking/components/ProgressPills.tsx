import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../tokens';

type Props = {
  /** Total number of steps in the Session Setup wizard. */
  total: number;
  /** 0-indexed current step. */
  currentIndex: number;
};

/**
 * Step indicator for the Session Setup wizard — matches onboarding /
 * `OnboardingProgressPills`: completed/current pills fill `color/primary`,
 * remaining pills are outlined (`transparent` + `borderOutline`).
 */
export function ProgressPills({ total, currentIndex }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.pill,
            index <= currentIndex
              ? { backgroundColor: colors.primary }
              : {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.borderOutline,
                },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  pill: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
});
