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
  const lineWidth = 2 + commitment.difficulty * 2;
  const showRunner = status === 'active' || status === 'overdue';
  const runnerScale = Math.max(0.54, 1 - Math.max(0, activeCount - 1) * 0.1 - commitment.difficulty * 0.04);
  const lineHitSlop = { bottom: 8, left: 12, right: 12, top: 8 };
  // Human on bottom first, bar starts from head with spacing
  const timelineHeight = height + topInset;
  const RUNNER_SLOT_H = 58;
  const RUNNER_BOTTOM = 8;
  const HEAD_OFFSET_FROM_SLOT_TOP = 9;
  const GAP_ABOVE_HEAD = 14;
  const maxBarBottom = timelineHeight - RUNNER_SLOT_H - RUNNER_BOTTOM + HEAD_OFFSET_FROM_SLOT_TOP - GAP_ABOVE_HEAD;
  const clampedFutureBottom = showRunner ? Math.min(futureBottom, maxBarBottom) : futureBottom;
  const clampedActiveBottom = showRunner ? Math.min(activeBottom, maxBarBottom) : activeBottom;

  // Title placement: day -> middle of bar beside it (no overlap), otherwise on top of bar
  const isDay = range === 'day';
  const minVisibleTop = topInset + 74;
  let titleTop: number;
  let titleWrapStyle: object;
  let titleStyle: object = {};
  if (isDay) {
    const barTop = status !== 'future' ? activeTop : futureTop;
    const barBottom = status !== 'future' ? clampedActiveBottom : clampedFutureBottom;
    const barMid = (barTop + barBottom) / 2;
    const rawDayTop = barMid - 7; // center around middle (half lineHeight)
    titleTop = Math.max(minVisibleTop, Math.min(rawDayTop, timelineHeight - 22));
    // Place text to the right of the centered bar with a clear gap — no overlap
    const gap = 10;
    titleWrapStyle = {
      top: titleTop,
      left: '50%' as const,
      marginLeft: lineWidth / 2 + gap,
      right: 2,
      alignItems: 'flex-start' as const,
    };
    titleStyle = { textAlign: 'left' as const };
  } else {
    const rawTitleTop = dueY - 34;
    const tTop = Math.max(6, Math.min(rawTitleTop, height + topInset - 30));
    titleTop = rawTitleTop < minVisibleTop ? minVisibleTop : tTop;
    titleWrapStyle = { top: titleTop, left: 2, right: 2, alignItems: 'center' as const };
    titleStyle = { textAlign: 'center' as const };
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {/* Title is now the trigger — tap text to open details, not bar tip */}
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
          {
            backgroundColor: timelineTheme.colors.future,
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
              backgroundColor: timelineTheme.colors.active,
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
            marginLeft: -6,
            top: Math.max(0, dueY - 6),
          },
        ]}
      />
      {showRunner && (
        <View
          pointerEvents="none"
          style={[styles.runnerSlot, { bottom: 8, left: '50%', marginLeft: -29 }]}>
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
    borderRadius: 8,
    opacity: 0.95,
    position: 'absolute',
    zIndex: 4,
  },
  activeLine: {
    zIndex: 6,
  },
  deadline: {
    backgroundColor: timelineTheme.colors.background,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    width: 12,
    zIndex: 7,
  },
  runnerSlot: {
    alignItems: 'center',
    height: 58,
    position: 'absolute',
    width: 58,
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
    color: timelineTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 15,
    textAlign: 'center',
  },
});

