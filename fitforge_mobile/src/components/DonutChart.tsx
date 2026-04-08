import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export default function DonutChart({
  data,
  size = 160,
  strokeWidth = 22,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercent = 0;

  const slices = data.map((slice) => {
    const percent = slice.value / total;
    const offset = circumference * (1 - cumulativePercent);
    const dashArray = `${circumference * percent} ${circumference * (1 - percent)}`;
    cumulativePercent += percent;
    return { ...slice, offset, dashArray };
  });

  // Rotate so first slice starts at the top (-90 degrees = top)
  const rotation = -90;

  return (
    <View style={styles.container}>
      <View style={[styles.chartWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#1E1E1E"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <G rotation={rotation} origin={`${center}, ${center}`}>
            {slices.map((slice, i) => (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth - 2}
                fill="none"
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.offset}
                strokeLinecap="butt"
              />
            ))}
          </G>
        </Svg>

        {/* Center text */}
        {centerLabel && (
          <View style={styles.centerContent}>
            <Text style={styles.centerValue}>{centerLabel}</Text>
            {centerSubLabel && (
              <Text style={styles.centerSub}>{centerSubLabel}</Text>
            )}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((slice, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendLabel}>{slice.label}</Text>
            <Text style={styles.legendValue}>{slice.value}s</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  chartWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerValue: {
    fontFamily: 'BebasNeue',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  centerSub: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    color: '#666666',
    letterSpacing: 0.5,
  },
  legend: {
    flex: 1,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: '#999999',
  },
  legendValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
    color: '#DDDDDD',
  },
});
