import { Pressable, StyleSheet, Text, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';
import { getCommitmentStatus, getTimePosition } from '@/domain/workload';
import type { Commitment, TimeRange } from '@/types/commitment';
import { Runner } from './Runner';

type Props = {
  commitment: Commitment;
  now: Date;
  windowStart: Date;
  windowEnd: Date;
  height: number;
  topInset: number;
  activeCount: number;
  range: TimeRange;
  onPressLine: (commitment: Commitment) => void;
};

function getDropTrackY(date: Date, windowStart: Date, windowEnd: Date, height: number, topInset: number) {
  return topInset + (1 - getTimePosition(date, windowStart, windowEnd)) * height;
}

export function CommitmentLane({ commitment, now, windowStart, windowEnd, height, topInset, activeCount, range, onPressLine }: Props) {
  const status = getCommitmentStatus(commitment, now);
  if (status === 'completed') return null;

  const startY = getDropTrackY(new Date(commitment.startAt), windowStart, windowEnd, height, topInset);
  const dueY = getDropTrackY(new Date(commitment.dueAt), windowStart, windowEnd, height, topInset);
  const currentY = getDropTrackY(now, windowStart, windowEnd, height, topInset);
  const futureTop = Math.min(startY, dueY);
  const futureBottom = Math.max(startY, dueY);
  const activeTop = Math.min(dueY, currentY);
  const activeBottom = Math.max(dueY, currentY);

  const lineWidth = commitment.difficulty === 1 ? 0.9 : commitment.difficulty === 2 ? 1.2 : 1.55;
  const showRunner = status === 'active' || status === 'overdue';
  const runnerScale = Math.max(0.7, 0.88 - Math.max(0, activeCount - 1) * 0.03 - commitment.difficulty * 0.01);
  const lineHitSlop = { bottom: 10, left: 14, right: 14, top: 10 };

  const timelineHeight = height + topInset;
  const RUNNER_SLOT_H = 40;
  const maxBarBottom = timelineHeight - RUNNER_SLOT_H - 17;
  const clampedFutureBottom = showRunner ? Math.min(futureBottom, maxBarBottom) : futureBottom;
  const clampedActiveBottom = showRunner ? Math.min(activeBottom, maxBarBottom) : activeBottom;

  const isDay = range === 'day';
  const isMonth = range === 'month';
  const minVisibleTop = topInset + 72;
  let titleWrapStyle: object;
  let titleStyle: object = {};

  if (isDay) {
    const barTop = status !== 'future' ? activeTop : futureTop;
    const barBottom = status !== 'future' ? clampedActiveBottom : clampedFutureBottom;
    const barMid = (barTop + barBottom) / 2;
    const titleTop = Math.max(minVisibleTop, Math.min(barMid - 7, timelineHeight - 24));
    titleWrapStyle = {
      top: titleTop,
      left: '50%' as const,
      marginLeft: lineWidth / 2 + 8,
      right: 2,
      alignItems: 'flex-start' as const,
    };
    titleStyle = { textAlign: 'left' as const };
  } else {
    const rawTitleTop = dueY - (isMonth ? 19 : 28);
    const titleTop = rawTitleTop < minVisibleTop ? minVisibleTop : Math.max(6, Math.min(rawTitleTop, timelineHeight - 28));
    titleWrapStyle = { top: titleTop, left: 1, right: 1, alignItems: 'center' as const };
    titleStyle = { textAlign: 'center' as const };
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable hitSlop={lineHitSlop} onPress={() => onPressLine(commitment)} style={[styles.titleWrap, titleWrapStyle]}>
        <Text ellipsizeMode="tail" numberOfLines={isMonth ? 1 : 2} style={[styles.title, isMonth && styles.monthTitle, titleStyle]}>
          {commitment.title}
        </Text>
      </Pressable>

      <View pointerEvents="none" style={[styles.line, styles.futureLine, { height: Math.max(16, clampedFutureBottom - futureTop), left: '50%', marginLeft: -lineWidth / 2, top: futureTop, width: lineWidth }]} />
      {status !== 'future' && (
        <View pointerEvents="none" style={[styles.line, styles.activeLine, { height: Math.max(18, clampedActiveBottom - activeTop), left: '50%', marginLeft: -lineWidth / 2, top: activeTop, width: lineWidth }]} />
      )}
      <View pointerEvents="none" style={[styles.deadline, { borderColor: status === 'future' ? '#4D4D4D' : '#D7D4D0', left: '50%', marginLeft: -3.25, top: Math.max(0, dueY - 3.25) }]} />
      {showRunner && (
        <View pointerEvents="none" style={[styles.runnerSlot, { bottom: 11, left: '50%', marginLeft: -17 }]}>
          <Runner fatigue={activeCount} scale={runnerScale} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, height: '100%', minWidth: 42, position: 'relative', zIndex: 5 },
  line: { borderRadius: 999, position: 'absolute', zIndex: 4 },
  futureLine: { backgroundColor: '#333333', opacity: 0.62 },
  activeLine: { backgroundColor: '#E3E0DC', opacity: 0.92, zIndex: 6 },
  deadline: { backgroundColor: timelineTheme.colors.background, borderRadius: 4, borderWidth: 1, height: 6.5, position: 'absolute', width: 6.5, zIndex: 7 },
  runnerSlot: { alignItems: 'center', height: 40, position: 'absolute', width: 34, zIndex: 1 },
  titleWrap: { alignItems: 'center', left: 2, position: 'absolute', right: 2, zIndex: 10 },
  title: { color: '#E1DEDA', fontSize: 10.25, fontWeight: '600', letterSpacing: 0.02, lineHeight: 11.5, textAlign: 'center' },
  monthTitle: { color: '#C8C5C1', fontSize: 9.25, fontWeight: '600' },
});