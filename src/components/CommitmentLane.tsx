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

export function CommitmentLane({
  commitment,
  now,
  windowStart,
  windowEnd,
  height,
  topInset,
  activeCount,
  range,
  onPressLine,
}: Props) {
  const status = getCommitmentStatus(commitment, now);
  const startY = getDropTrackY(new Date(commitment.startAt), windowStart, windowEnd, height, topInset);
  const dueY = getDropTrackY(new Date(commitment.dueAt), windowStart, windowEnd, height, topInset);
  const currentY = getDropTrackY(now, windowStart, windowEnd, height, topInset);
  const futureTop = Math.min(startY, dueY);
  const futureBottom = Math.max(startY, dueY);
  const activeTop = Math.min(dueY, currentY);
  const activeBottom = Math.max(dueY, currentY);

  // Keep difficulty visible, but use a restrained visual scale instead of thick bars.
  const lineWidth = commitment.difficulty === 1 ? 1.25 : commitment.difficulty === 2 ? 1.75 : 2.4;
  const showRunner = status === 'active' || status === 'overdue';
  const runnerScale = Math.max(0.68, 0.94 - Math.max(0, activeCount - 1) * 0.045 - commitment.difficulty * 0.018);
  const lineHitSlop = { bottom: 10, left: 14, right: 14, top: 10 };

  const timelineHeight = height + topInset;
  const RUNNER_SLOT_H = 52;
  const RUNNER_BOTTOM = 10;
  const HEAD_OFFSET_FROM_SLOT_TOP = 8;
  const GAP_ABOVE_HEAD = 11;
  const maxBarBottom = timelineHeight - RUNNER_SLOT_H - RUNNER_BOTTOM + HEAD_OFFSET_FROM_SLOT_TOP - GAP_ABOVE_HEAD;
  const clampedFutureBottom = showRunner ? Math.min(futureBottom, maxBarBottom) : futureBottom;
  const clampedActiveBottom = showRunner ? Math.min(activeBottom, maxBarBottom) : activeBottom;

  const isDay = range === 'day';
  const minVisibleTop = topInset + 74;
  let titleTop: number;
  let titleWrapStyle: object;
  let titleStyle: object = {};
  if (isDay) {
    const barTop = status !== 'future' ? activeTop : futureTop;
    const barBottom = status !== 'future' ? clampedActiveBottom : clampedFutureBottom;
    const barMid = (barTop + barBottom) / 2;
    const rawDayTop = barMid - 7;
    titleTop = Math.max(minVisibleTop, Math.min(rawDayTop, timelineHeight - 22));
    const gap = 9;
    titleWrapStyle = {
      top: titleTop,
      left: '50%' as const,
      marginLeft: lineWidth / 2 + gap,
      right: 2,
      alignItems: 'flex-start' as const,
    };
    titleStyle = { textAlign: 'left' as const };
  } else {
    const rawTitleTop = dueY - 31;
    const tTop = Math.max(6, Math.min(rawTitleTop, height + topInset - 30));
    titleTop = rawTitleTop < minVisibleTop ? minVisibleTop : tTop;
    titleWrapStyle = { top: titleTop, left: 2, right: 2, alignItems: 'center' as const };
    titleStyle = { textAlign: 'center' as const };
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable
        hitSlop={lineHitSlop}
        onPress={() => onPressLine(commitment)}
        style={[styles.titleWrap, titleWrapStyle]}>
        <Text numberOfLines={2} style={[styles.title, titleStyle]}>
          {commitment.title}
        </Text>
      </Pressable>

      <View
        pointerEvents="none"
        style={[
          styles.line,
          styles.futureLine,
          {
            height: Math.max(16, clampedFutureBottom - futureTop),
            left: '50%',
            marginLeft: -lineWidth / 2,
            top: futureTop,
            width: lineWidth,
          },
        ]}
      />
      {status !== 'future' && (
        <View
          pointerEvents="none"
          style={[
            styles.line,
            styles.activeLine,
            {
              height: Math.max(18, clampedActiveBottom - activeTop),
              left: '50%',
              marginLeft: -lineWidth / 2,
              top: activeTop,
              width: lineWidth,
            },
          ]}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.deadline,
          {
            borderColor: status === 'future' ? timelineTheme.colors.future : timelineTheme.colors.active,
            left: '50%',
            marginLeft: -4.5,
            top: Math.max(0, dueY - 4.5),
          },
        ]}
      />
      {showRunner && (
        <View
          pointerEvents="none"
          style={[styles.runnerSlot, { bottom: 10, left: '50%', marginLeft: -24 }]}>
          <Runner fatigue={activeCount} scale={runnerScale} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    minWidth: 42,
    position: 'relative',
    zIndex: 5,
  },
  line: {
    borderRadius: 999,
    position: 'absolute',
    zIndex: 4,
  },
  futureLine: {
    backgroundColor: '#464646',
    opacity: 0.66,
  },
  activeLine: {
    backgroundColor: '#EAEAEA',
    opacity: 0.92,
    zIndex: 6,
  },
  deadline: {
    backgroundColor: timelineTheme.colors.background,
    borderRadius: 5,
    borderWidth: 1.25,
    height: 9,
    position: 'absolute',
    width: 9,
    zIndex: 7,
  },
  runnerSlot: {
    alignItems: 'center',
    height: 52,
    position: 'absolute',
    width: 48,
    zIndex: 1,
  },
  titleWrap: {
    alignItems: 'center',
    left: 2,
    position: 'absolute',
    right: 2,
    zIndex: 10,
  },
  title: {
    color: '#ECECEC',
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.15,
    lineHeight: 13,
    textAlign: 'center',
  },
});
