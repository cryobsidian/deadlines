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
  activeCount: number;
  onPress: (commitment: Commitment) => void;
};

function getDropTrackY(date: Date, windowStart: Date, windowEnd: Date, height: number) {
  return (1 - getTimePosition(date, windowStart, windowEnd)) * height;
}

export function CommitmentLane({
  commitment,
  now,
  windowStart,
  windowEnd,
  height,
  activeCount,
  onPress,
}: Props) {
  const status = getCommitmentStatus(commitment, now);
  const startY = getDropTrackY(new Date(commitment.startAt), windowStart, windowEnd, height);
  const dueY = getDropTrackY(new Date(commitment.dueAt), windowStart, windowEnd, height);
  const currentY = getDropTrackY(now, windowStart, windowEnd, height);
  const futureTop = Math.min(startY, dueY);
  const futureBottom = Math.max(startY, dueY);
  const activeTop = Math.min(dueY, currentY);
  const activeBottom = Math.max(dueY, currentY);
  const lineWidth = 2 + commitment.difficulty * 2;
  const showRunner = status === 'active' || status === 'overdue';
  const runnerScale = Math.max(0.54, 1 - Math.max(0, activeCount - 1) * 0.1 - commitment.difficulty * 0.04);
  const titleTop = Math.min(height - 96, Math.max(36, activeTop + (activeBottom - activeTop) * 0.58));

  return (
    <Pressable onPress={() => onPress(commitment)} style={styles.container}>
      <View
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
        <View
          style={[
            styles.line,
            {
              backgroundColor: timelineTheme.colors.active,
              height: Math.max(18, activeBottom - activeTop),
              top: activeTop,
              width: lineWidth,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.deadline,
          {
            borderColor: status === 'future' ? timelineTheme.colors.future : timelineTheme.colors.active,
            top: Math.max(0, dueY - 6),
          },
        ]}
      />
      {showRunner && (
        <View style={[styles.runnerSlot, { bottom: 8 }]}>
          <Runner fatigue={activeCount} scale={runnerScale} />
        </View>
      )}
      {showRunner && <Text style={[styles.title, { top: titleTop }]}>{commitment.title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    minWidth: 42,
    position: 'relative',
  },
  line: {
    borderRadius: 8,
    opacity: 0.95,
    position: 'absolute',
  },
  deadline: {
    backgroundColor: timelineTheme.colors.background,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    width: 12,
  },
  runnerSlot: {
    alignItems: 'center',
    height: 58,
    position: 'absolute',
    width: 58,
  },
  title: {
    color: timelineTheme.colors.text,
    fontSize: 13,
    fontWeight: '500',
    left: '58%',
    letterSpacing: 0,
    position: 'absolute',
    width: 92,
  },
});
