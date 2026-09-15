import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radius } from '../tokens';

const CHART_HEIGHT = 160;

export type WeeklyHoursDatum = {
  day: string;
  /** Minutes of service logged that day (Figma `home_dashboard___final_branding` mock values). */
  minutes: number;
};

type Props = {
  data: WeeklyHoursDatum[];
  /** Top of the y-axis. Gridlines are drawn every `step` up to this value. */
  maxValue?: number;
  step?: number;
};

/**
 * Bar chart for the Home dashboard's "Service Hours" card (Figma `406:315`
 * Graph container). Plain-View bars rather than an SVG/charting lib — the
 * source design has no interactivity, just 7 static bars, so flexbox handles
 * it without a new dependency.
 */
export function WeeklyHoursChart({ data, maxValue = 300, step = 50 }: Props) {
  const ticks: number[] = [];
  for (let v = maxValue; v >= 0; v -= step) {
    ticks.push(v);
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.yAxis}>
          {ticks.map((tick) => (
            <Text key={tick} style={styles.yAxisLabel}>
              {tick}
            </Text>
          ))}
        </View>
        <View style={styles.chartArea}>
          {ticks.slice(1, -1).map((tick) => (
            <View
              key={tick}
              style={[styles.gridline, { top: (1 - tick / maxValue) * CHART_HEIGHT }]}
            />
          ))}
          {data.map((datum) => {
            const barHeight = Math.max(4, (datum.minutes / maxValue) * CHART_HEIGHT);
            return (
              <View key={datum.day} style={styles.column}>
                <View style={[styles.bar, { height: barHeight }]}>
                  <Text style={styles.barValue}>{datum.minutes}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.dayLabelsRow}>
        <View style={styles.yAxisSpacer} />
        <View style={styles.dayLabelsInner}>
          {data.map((datum) => (
            <Text key={datum.day} style={styles.dayLabel}>
              {datum.day}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  yAxis: {
    width: 28,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yAxisSpacer: {
    width: 36,
  },
  yAxisLabel: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 11,
    color: colors.primary,
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  gridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderOutline,
  },
  column: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '68%',
    backgroundColor: colors.primary,
    borderRadius: 3,
    alignItems: 'center',
    paddingTop: 4,
  },
  barValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 10,
    color: colors.textOnPrimary,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  dayLabelsInner: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 11,
    color: colors.primary,
  },
});
