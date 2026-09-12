import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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

const fallbackTimelineHeight = 520;

type Props = {
  commitments: Commitment[];
  now: Date;
  range: TimeRange;
  windowStart: Date;
  windowEnd: Date;
};

type Selection = Commitment;

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

function formatFullDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDurationLabel(startAt: string, dueAt: string) {
  const ms = new Date(dueAt).getTime() - new Date(startAt).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Less than a day';
  return `${days} day${days === 1 ? '' : 's'}`;
}

function getStatusLabel(commitment: Commitment, now: Date) {
  return getCommitmentStatus(commitment, now);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTopContentInset(height: number) {
  return clamp(height * 0.18, 92, 118);
}

export function VerticalTimeline({ commitments, now, range, windowStart, windowEnd }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [laneFieldSize, setLaneFieldSize] = useState({ height: fallbackTimelineHeight, width: 0 });
  const ticks = getVisibleDateTicks(range, windowStart);
  const overloadPeriods = identifyOverloadPeriods(commitments, windowStart, windowEnd);
  const activeCount = commitments.filter((commitment) => getCommitmentStatus(commitment, now) === 'active').length;
  const score = calculateWorkloadScore(commitments, now);
  const timelineHeight = Math.max(1, laneFieldSize.height);
  const contentTopInset = getTopContentInset(timelineHeight);
  const contentHeight = Math.max(1, timelineHeight - contentTopInset);

  return (
    <View style={styles.outer}>
      <View style={styles.timeline}>
        <View style={styles.railColumn}>
          <View style={styles.railLine} />
          {ticks.map((tick) => {
            const top = contentTopInset + (1 - getTimePosition(tick, windowStart, windowEnd)) * contentHeight;
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

          <View pointerEvents="none" style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>WORKLOAD</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>

          {overloadPeriods.map((period) => {
            const startY = contentTopInset + (1 - getTimePosition(period.start, windowStart, windowEnd)) * contentHeight;
            const endY = contentTopInset + (1 - getTimePosition(period.end, windowStart, windowEnd)) * contentHeight;
            const top = Math.min(startY, endY);
            const bottom = Math.max(startY, endY);
            return (
              <View
                key={`${period.start.toISOString()}-${period.end.toISOString()}`}
                pointerEvents="none"
                style={[
                  styles.overloadRegion,
                  {
                    top,
                    height: Math.max(4, bottom - top),
                  },
                ]}
              />
            );
          })}
          {commitments.map((commitment) => (
            <CommitmentLane
              activeCount={activeCount}
              commitment={commitment}
              height={contentHeight}
              key={commitment.id}
              now={now}
              onPressLine={(pressedCommitment) => setSelection(pressedCommitment)}
              topInset={contentTopInset}
              windowEnd={windowEnd}
              windowStart={windowStart}
            />
          ))}
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setSelection(null)}
        statusBarTranslucent
        transparent
        visible={!!selection}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => setSelection(null)} style={styles.modalBackdrop} />
          {selection && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selection.title}</Text>
                {(() => {
                  const s = getStatusLabel(selection, now);
                  return (
                    <View
                      style={[
                        styles.statusBadge,
                        s === 'active' && styles.statusActive,
                        s === 'overdue' && styles.statusOverdue,
                        s === 'future' && styles.statusFuture,
                        s === 'completed' && styles.statusCompleted,
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          s === 'active' && styles.statusTextActive,
                          s === 'overdue' && styles.statusTextLight,
                          s === 'completed' && styles.statusTextLight,
                        ]}>
                        {s.toUpperCase()}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Starts</Text>
                  <Text style={styles.detailValue}>{formatFullDateTime(selection.startAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due</Text>
                  <Text style={styles.detailValue}>{formatFullDateTime(selection.dueAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{getDurationLabel(selection.startAt, selection.dueAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Difficulty</Text>
                  <View style={styles.difficultyPill}>
                    <Text style={styles.difficultyPillText}>
                      {selection.difficulty === 1 ? 'Easy' : selection.difficulty === 2 ? 'Medium' : 'Hard'} · {selection.difficulty}/3
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable onPress={() => setSelection(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    minHeight: 0,
  },
  scoreBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    right: 10,
    top: 96,
    zIndex: 15,
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
    marginRight: 10,
    position: 'relative',
    width: 86,
  },
  railLine: {
    backgroundColor: timelineTheme.colors.rail,
    bottom: 0,
    position: 'absolute',
    right: 5,
    top: 0,
    width: 1,
  },
  tick: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    right: -1,
    transform: [{ translateY: -8 }],
    width: 86,
  },
  tickLabel: {
    color: timelineTheme.colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
    marginRight: 12,
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCard: {
    backgroundColor: '#121212',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 18,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: timelineTheme.colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  statusBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: '#F5F5F5',
  },
  statusOverdue: {
    backgroundColor: '#FF4D4D',
  },
  statusFuture: {
    backgroundColor: '#3A3A3A',
  },
  statusCompleted: {
    backgroundColor: '#2E7D32',
  },
  statusText: {
    color: timelineTheme.colors.mutedText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusTextActive: {
    color: '#111111',
  },
  statusTextLight: {
    color: '#FFFFFF',
  },
  detailGrid: {
    gap: 12,
    marginTop: 16,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: timelineTheme.colors.mutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: timelineTheme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  difficultyPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderColor: timelineTheme.colors.outline,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  difficultyPillText: {
    color: timelineTheme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: timelineTheme.colors.text,
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
  },
});

