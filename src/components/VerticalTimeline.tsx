import { StyleSheet, Text, View } from 'react-native';

import { CommitmentLane } from '@/components/CommitmentLane';
import { timelineTheme } from '@/constants/theme';
import {
  calculateWorkloadScore,
  getCommitmentStatus,
  getTimePosition,
  getVisibleDateTicks,
  identifyOverloadPeriods,
} from '@/domain/workload';
import type { Commitment, TimeRange } from '@/types/commitment';

type Props = {
  commitments: Commitment[];
  now: Date;
  range: TimeRange;
  windowStart: Date;
  windowEnd: Date;
  selectedCommitment: Commitment | null;
  onSelectCommitment: (commitment: Commitment) => void;
};

function formatTick(date: Date, range: TimeRange, now: Date) {
  if (range === 'day') {
    return `${date.getHours().toString().padStart(2, '0')}:00`;
  }

  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return 'TODAY';
  }

  return `${date.toLocaleString(undefined, { month: 'short' }).toUpperCase()} ${date.getDate()}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleString(undefined, { month: 'short' })} ${date.getDate()}, ${date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function VerticalTimeline({
  commitments,
  now,
  range,
  windowStart,
  windowEnd,
  selectedCommitment,
  onSelectCommitment,
}: Props) {
  const ticks = getVisibleDateTicks(range, windowStart);
  const overloadPeriods = identifyOverloadPeriods(commitments, windowStart, windowEnd);
  const activeCount = commitments.filter((commitment) => getCommitmentStatus(commitment, now) === 'active').length;
  const score = calculateWorkloadScore(commitments, now);

  return (
    <View style={styles.outer}>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>WORKLOAD</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
      <View style={styles.timeline}>
        <View style={styles.railColumn}>
          <View style={styles.railLine} />
          {ticks.map((tick) => {
            const top = (1 - getTimePosition(tick, windowStart, windowEnd)) * 560;
            const label = formatTick(tick, range, now);
            const isToday = label === 'TODAY';
            return (
              <View key={tick.toISOString()} style={[styles.tick, { top }]}>
                <Text style={[styles.tickLabel, isToday && styles.todayLabel]}>{label}</Text>
                <View style={[styles.tickDot, isToday && styles.todayDot]} />
              </View>
            );
          })}
        </View>

        <View style={styles.laneField}>
          {overloadPeriods.map((period) => {
            const top = getTimePosition(period.start, windowStart, windowEnd) * 100;
            const bottom = getTimePosition(period.end, windowStart, windowEnd) * 100;
            return (
              <View
                key={`${period.start.toISOString()}-${period.end.toISOString()}`}
                style={[
                  styles.overloadRegion,
                  {
                    top: `${top}%`,
                    height: `${Math.max(4, bottom - top)}%`,
                  },
                ]}
              />
            );
          })}
          {commitments.map((commitment) => (
            <CommitmentLane
              activeCount={activeCount}
              commitment={commitment}
              height={560}
              key={commitment.id}
              now={now}
              onPress={onSelectCommitment}
              windowEnd={windowEnd}
              windowStart={windowStart}
            />
          ))}
        </View>
      </View>

      {selectedCommitment && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>{selectedCommitment.title}</Text>
          <Text style={styles.infoText}>Starts {formatDateTime(selectedCommitment.startAt)}</Text>
          <Text style={styles.infoText}>Due {formatDateTime(selectedCommitment.dueAt)}</Text>
          <Text style={styles.infoText}>Difficulty {selectedCommitment.difficulty}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    minHeight: 620,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingRight: 14,
  },
  scoreLabel: {
    color: timelineTheme.colors.mutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
  },
  scoreValue: {
    color: timelineTheme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  timeline: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 560,
  },
  railColumn: {
    height: 560,
    marginRight: 14,
    position: 'relative',
    width: 104,
  },
  railLine: {
    backgroundColor: timelineTheme.colors.rail,
    bottom: 0,
    position: 'absolute',
    right: 8,
    top: 0,
    width: 1,
  },
  tick: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    right: 2,
    transform: [{ translateY: -8 }],
    width: 102,
  },
  tickLabel: {
    color: timelineTheme.colors.mutedText,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
    marginRight: 16,
  },
  todayLabel: {
    color: timelineTheme.colors.text,
    fontWeight: '900',
  },
  tickDot: {
    backgroundColor: timelineTheme.colors.railDot,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  todayDot: {
    backgroundColor: timelineTheme.colors.active,
    shadowColor: timelineTheme.colors.active,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  laneField: {
    flex: 1,
    flexDirection: 'row',
    height: 560,
    overflow: 'hidden',
    position: 'relative',
  },
  overloadRegion: {
    backgroundColor: timelineTheme.colors.overload,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  infoPanel: {
    alignSelf: 'center',
    backgroundColor: timelineTheme.colors.panel,
    borderColor: timelineTheme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    bottom: 4,
    padding: 12,
    position: 'absolute',
    width: '82%',
  },
  infoTitle: {
    color: timelineTheme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 4,
  },
  infoText: {
    color: timelineTheme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 0,
    marginTop: 2,
  },
});



