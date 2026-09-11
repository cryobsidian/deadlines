import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

const fallbackTimelineHeight = 420;
const infoPanelWidth = 212;
const infoPanelHeight = 116;

type Props = {
  commitments: Commitment[];
  now: Date;
  range: TimeRange;
  windowStart: Date;
  windowEnd: Date;
};

type Selection = {
  commitment: Commitment;
  laneIndex: number;
  anchorY: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function VerticalTimeline({ commitments, now, range, windowStart, windowEnd }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [laneFieldSize, setLaneFieldSize] = useState({ height: fallbackTimelineHeight, width: 0 });
  const ticks = getVisibleDateTicks(range, windowStart);
  const overloadPeriods = identifyOverloadPeriods(commitments, windowStart, windowEnd);
  const activeCount = commitments.filter((commitment) => getCommitmentStatus(commitment, now) === 'active').length;
  const score = calculateWorkloadScore(commitments, now);
  const timelineHeight = Math.max(1, laneFieldSize.height);
  const laneWidth = laneFieldSize.width > 0 ? laneFieldSize.width / commitments.length : 0;
  const panelLeft = selection
    ? clamp(selection.laneIndex * laneWidth + laneWidth * 0.58, 8, Math.max(8, laneFieldSize.width - infoPanelWidth - 8))
    : 0;
  const panelTop = selection ? clamp(selection.anchorY - 20, 8, timelineHeight - infoPanelHeight - 8) : 0;

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
            const top = (1 - getTimePosition(tick, windowStart, windowEnd)) * timelineHeight;
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

        <View
          onLayout={(event) => {
            const { height, width } = event.nativeEvent.layout;
            setLaneFieldSize({ height, width });
          }}
          style={styles.laneField}>
          <Pressable accessibilityLabel="Dismiss commitment details" onPress={() => setSelection(null)} style={styles.dismissLayer} />

          {overloadPeriods.map((period) => {
            const startY = (1 - getTimePosition(period.start, windowStart, windowEnd)) * 100;
            const endY = (1 - getTimePosition(period.end, windowStart, windowEnd)) * 100;
            const top = Math.min(startY, endY);
            const bottom = Math.max(startY, endY);
            return (
              <View
                key={`${period.start.toISOString()}-${period.end.toISOString()}`}
                pointerEvents="none"
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
          {commitments.map((commitment, index) => (
            <CommitmentLane
              activeCount={activeCount}
              commitment={commitment}
              height={timelineHeight}
              key={commitment.id}
              now={now}
              onPressLine={(pressedCommitment, anchorY) =>
                setSelection({ commitment: pressedCommitment, laneIndex: index, anchorY })
              }
              windowEnd={windowEnd}
              windowStart={windowStart}
            />
          ))}

          {selection && (
            <Pressable style={[styles.infoPanel, { left: panelLeft, top: panelTop }]}>
              <Text style={styles.infoTitle}>{selection.commitment.title}</Text>
              <Text style={styles.infoText}>Starts {formatDateTime(selection.commitment.startAt)}</Text>
              <Text style={styles.infoText}>Due {formatDateTime(selection.commitment.dueAt)}</Text>
              <Text style={styles.infoText}>Difficulty {selection.commitment.difficulty}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    minHeight: 0,
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
    minHeight: 0,
  },
  railColumn: {
    flex: 0,
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
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  dismissLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
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
    zIndex: 1,
  },
  infoPanel: {
    backgroundColor: timelineTheme.colors.panel,
    borderColor: timelineTheme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: infoPanelHeight,
    padding: 12,
    position: 'absolute',
    width: infoPanelWidth,
    zIndex: 20,
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
