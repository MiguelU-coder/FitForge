import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80; // padding
const CHART_HEIGHT = 120;
const PADDING = { top: 16, bottom: 24, left: 28, right: 12 };

interface DataPoint {
  value: number;
  label: string;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  label?: string;
}

export default function LineChart({ data, color = '#10B981', label }: LineChartProps) {
  if (!data.length) return null;

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const getX = (i: number) => PADDING.left + (i / (data.length - 1)) * innerWidth;
  const getY = (val: number) => PADDING.top + (1 - (val - minVal) / range) * innerHeight;

  // Build SVG path
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  // Smooth bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Fill area
  const areaPath = `${pathD} L ${points[points.length - 1].x} ${PADDING.top + innerHeight} L ${points[0].x} ${PADDING.top + innerHeight} Z`;

  // Y-axis labels (3 levels)
  const yLevels = [maxVal, Math.round((maxVal + minVal) / 2), minVal];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.chartLabel}>{label}</Text>}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid lines */}
        {yLevels.map((val, i) => {
          const y = getY(val);
          return (
            <React.Fragment key={i}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke="#222222"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={PADDING.left - 4}
                y={y + 4}
                fontSize={9}
                fill="#555555"
                textAnchor="end"
                fontFamily="DMSans-Medium"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#lineGrad)" />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points + X labels */}
        {points.map((pt, i) => (
          <React.Fragment key={i}>
            <Circle cx={pt.x} cy={pt.y} r={3.5} fill={color} />
            <Circle cx={pt.x} cy={pt.y} r={6} fill={color} fillOpacity={0.15} />
            <SvgText
              x={pt.x}
              y={CHART_HEIGHT - 4}
              fontSize={9}
              fill="#555555"
              textAnchor="middle"
              fontFamily="DMSans-Medium"
            >
              {data[i].label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  chartLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#555555',
    marginBottom: 8,
    marginLeft: 28,
  },
});
