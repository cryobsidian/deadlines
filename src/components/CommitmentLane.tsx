import { Pressable, StyleSheet, Text, View } from 'react-native';

import { timelineTheme } from '@/constants/theme';
import { getCommitmentStatus, getTimePosition } from '@/domain/workload';
import type { Commitment } from '@/types/commitment';
import { Runner } from './Runner';

type Props = {
  commitment: Commitment;
  now: Date;
  windowStart: Date;
  windowEnd: Date;
  height: number;
  topInset: number;
  activeCount: number;
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
  // Place label directly on top of the bar (above deadline marker) - offset increased for larger text
  const rawTitleTop = dueY - 34;
  // Keep label below the header overlay (zIndex 30) so it stays visible
  const minVisibleTop = topInset + 74;
  const titleTop = Math.max(6, Math.min(rawTitleTop, height + topInset - 30));
  const clampedTitleTop = rawTitleTop < minVisibleTop ? minVisibleTop : titleTop;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {/* Title on top of each bar */}
      <View pointerEvents="none" style={[styles.titleWrap, { top: clampedTitleTop }]}>
        <Text numberOfLines={2} style={styles.title}>
          {commitment.title}
        </Text>
      </View>

      <Pressable
        hitSlop={lineHitSlop}
        onPress={() => onPressLine(commitment)}
        style={[
          styles.line,
          {
            backgroundColor: timelineTheme.colors.future,
            height: Math.max(16, futureBottom - futureTop),
            top: futureTop,
            width: lineWidth,
          },
        ]}
      />
      {status !== 'future' && (
        <Pressable
          hitSlop={lineHitSlop}
          onPress={() => onPressLine(commitment)}
          style={[
            styles.line,
            styles.activeLine,
            {
              backgroundColor: timelineTheme.colors.active,
              height: Math.max(18, activeBottom - activeTop),
              top: activeTop,
              width: lineWidth,
            },
          ]}
        />
      )}
      <Pressable
        hitSlop={lineHitSlop}
        onPress={() => onPressLine(commitment)}
        style={[
          styles.deadline,
          {
            borderColor: status === 'future' ? timelineTheme.colors.future : timelineTheme.colors.active,
            top: Math.max(0, dueY - 6),
          },
        ]}
      />
      {showRunner && (
        <View pointerEvents="none" style={[styles.runnerSlot, { bottom: 8 }]}>
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
    zIndex: 9,
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

