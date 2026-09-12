import { StyleSheet, Text, View } from 'react-native';

import type { TimeRange } from '@/types/commitment';
import type { ProtectedRecoveryWindow } from '@/components/CapacityDecisionSheet';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function position(date: Date, start: Date, end: Date) {
  const span = end.getTime() - start.getTime();
  if (span <= 0) return 0;
  return clamp((date.getTime() - start.getTime()) / span, 0, 1);
}

export function RecoveryMarker({
  recovery,
  range,
  windowStart,
  windowEnd,
  height,
}: {
  recovery: ProtectedRecoveryWindow | null;
  range: TimeRange;
  windowStart: Date;
  windowEnd: Date;
  height: number;
}) {
  if (!recovery) return null;

  const start = new Date(recovery.start);
  const end = new Date(recovery.end);
  if (end < windowStart || start > windowEnd) return null;

  const topInset = clamp(height * 0.16, 84, 106);
  const contentHeight = Math.max(1, height - topInset);
  const startY = topInset + (1 - position(start, windowStart, windowEnd)) * contentHeight;
  const endY = topInset + (1 - position(end, windowStart, windowEnd)) * contentHeight;
  const top = Math.min(startY, endY);
  const markerHeight = Math.max(range === 'day' ? 26 : 18, Math.abs(endY - startY));

  return (
    <View pointerEvents="none" style={[styles.marker, { top, height: markerHeight }]}>
      <Text style={styles.label}>RECOVERY · PROTECTED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    backgroundColor: 'rgba(123,154,129,0.08)',
    borderColor: 'rgba(143,175,149,0.46)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'flex-start',
    left: 67,
    paddingRight: 8,
    paddingTop: 6,
    position: 'absolute',
    right: 0,
    zIndex: 12,
  },
  label: {
    alignSelf: 'flex-end',
    color: '#8FAF95',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
});