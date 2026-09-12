import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CommitmentLane } from '@/components/CommitmentLane';
import { timelineTheme } from '@/constants/theme';
import {
  calculateWorkloadScore,
  getCommitmentStatus,
  getTimePosition,
  getVisibleDateTicks,
  getWorkloadBand,
  identifyOverloadPeriods,
  isCommitmentActiveOn,
  type OverloadPeriod,
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
  if (range === 'day') return `${date.getHours().toString().padStart(2, '0')}:00`;
  if (date.toDateString() === now.toDateString()) return 'TODAY';
  return `${date.toLocaleString(undefined, { month: 'short' }).toUpperCase()} ${date.getDate()}`;
}

function formatFullDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getDurationLabel(startAt: string, dueAt: string) {
  const ms = new Date(dueAt).getTime() - new Date(startAt).getTime();
  const days = Math.round(ms / 86400000);
  if (days <= 0) return 'Less than a day';
  return `${days} day${days === 1 ? '' : 's'}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTopContentInset(height: number) {
  return clamp(height * 0.18, 92, 118);
}

function getPeriodMidpoint(period: OverloadPeriod) {
  return new Date((period.start.getTime() + period.end.getTime()) / 2);
}

function getPressureCommitments(commitments: Commitment[], period: OverloadPeriod) {
  const midpoint = getPeriodMidpoint(period);
  return commitments
    .filter((commitment) => isCommitmentActiveOn(commitment, midpoint))
    .sort((a, b) => b.difficulty - a.difficulty);
}

function getRebalanceCandidate(commitments: Commitment[]) {
  return commitments.find((item) => item.flexibility === 'flexible') ?? commitments.find((item) => item.flexibility === 'droppable');
}

function titleCase(value?: string) {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function VerticalTimeline({ commitments, now, range, windowStart, windowEnd }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pressureSelection, setPressureSelection] = useState<OverloadPeriod | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [laneFieldSize, setLaneFieldSize] = useState({ height: fallbackTimelineHeight, width: 0 });

  const ticks = getVisibleDateTicks(range, windowStart);
  const overloadPeriods = identifyOverloadPeriods(commitments, windowStart, windowEnd);
  const activeCount = commitments.filter((commitment) => getCommitmentStatus(commitment, now) === 'active').length;
  const score = calculateWorkloadScore(commitments, now);
  const timelineHeight = Math.max(1, laneFieldSize.height);
  const contentTopInset = getTopContentInset(timelineHeight);
  const contentHeight = Math.max(1, timelineHeight - contentTopInset);

  const pressureItems = pressureSelection ? getPressureCommitments(commitments, pressureSelection) : [];
  const rebalanceCandidate = getRebalanceCandidate(pressureItems);
  const pressureMidpoint = pressureSelection ? getPeriodMidpoint(pressureSelection) : null;
  const beforeScore = pressureMidpoint ? calculateWorkloadScore(commitments, pressureMidpoint) : 0;
  const afterScore = rebalanceCandidate ? Math.max(0, beforeScore - rebalanceCandidate.difficulty) : beforeScore;
  const beforeBand = getWorkloadBand(beforeScore);
  const afterBand = getWorkloadBand(afterScore);

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
            const regionHeight = Math.max(34, bottom - top);
            return (
              <Pressable
                accessibilityLabel="Review high pressure period"
                key={`${period.start.toISOString()}-${period.end.toISOString()}`}
                onPress={() => {
                  setPressureSelection(period);
                  setShowPreview(false);
                }}
                style={[styles.overloadRegion, { top, height: regionHeight }]}> 
                <Text style={styles.pressureLabel}>HIGH PRESSURE · TAP TO REVIEW</Text>
              </Pressable>
            );
          })}

          {commitments.map((commitment) => (
            <CommitmentLane
              activeCount={activeCount}
              commitment={commitment}
              height={contentHeight}
              key={commitment.id}
              now={now}
              range={range}
              onPressLine={(pressedCommitment) => setSelection(pressedCommitment)}
              topInset={contentTopInset}
              windowEnd={windowEnd}
              windowStart={windowStart}
            />
          ))}
        </View>
      </View>

      <Modal animationType="fade" onRequestClose={() => setSelection(null)} statusBarTranslucent transparent visible={!!selection}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={() => setSelection(null)} style={styles.modalBackdrop} />
          {selection && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selection.title}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getCommitmentStatus(selection, now).toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Starts</Text><Text style={styles.detailValue}>{formatFullDateTime(selection.startAt)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Due</Text><Text style={styles.detailValue}>{formatFullDateTime(selection.dueAt)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Duration</Text><Text style={styles.detailValue}>{getDurationLabel(selection.startAt, selection.dueAt)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Difficulty</Text><Text style={styles.detailValue}>{selection.difficulty === 1 ? 'Easy' : selection.difficulty === 2 ? 'Medium' : 'Hard'} · {selection.difficulty}/3</Text></View>
                <View style={styles.metaRow}>
                  <View style={styles.metaPill}><Text style={styles.metaText}>{titleCase(selection.priority)} priority</Text></View>
                  <View style={styles.metaPill}><Text style={styles.metaText}>{titleCase(selection.flexibility)}</Text></View>
                </View>
              </View>

              <Pressable onPress={() => setSelection(null)} style={styles.closeButton}><Text style={styles.closeButtonText}>Close</Text></Pressable>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setPressureSelection(null)}
        statusBarTranslucent
        transparent
        visible={!!pressureSelection}>
        <View style={styles.pressureOverlay}>
          <Pressable onPress={() => setPressureSelection(null)} style={styles.modalBackdrop} />
          {pressureSelection && (
            <View style={styles.pressureCard}>
              <View style={styles.grabber} />
              <Text style={styles.eyebrow}>PRESSURE REVIEW</Text>
              <Text style={styles.pressureTitle}>{titleCase(beforeBand)} workload ahead</Text>
              <Text style={styles.pressureSubtitle}>
                {pressureItems.length} commitments overlap in this window. Deadlines shows what is creating the pressure before it hits.
              </Text>

              <View style={styles.commitmentList}>
                {pressureItems.map((item) => (
                  <View key={item.id} style={styles.pressureItem}>
                    <View style={styles.pressureItemCopy}>
                      <Text style={styles.pressureItemTitle}>{item.title}</Text>
                      <Text style={styles.pressureItemMeta}>{titleCase(item.priority)} priority · {titleCase(item.flexibility)}</Text>
                    </View>
                    <Text style={styles.pressureDifficulty}>{item.difficulty}/3</Text>
                  </View>
                ))}
              </View>

              {rebalanceCandidate ? (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionLabel}>REBALANCE CANDIDATE</Text>
                  <Text style={styles.suggestionTitle}>{rebalanceCandidate.title}</Text>
                  <Text style={styles.suggestionText}>
                    This commitment is {rebalanceCandidate.flexibility}. Moving it outside this pressure window would reduce the overlapping load.
                  </Text>

                  {showPreview ? (
                    <View style={styles.previewRow}>
                      <View style={styles.previewBlock}>
                        <Text style={styles.previewLabel}>BEFORE</Text>
                        <Text style={styles.previewValue}>{beforeScore}</Text>
                        <Text style={styles.previewBand}>{titleCase(beforeBand)}</Text>
                      </View>
                      <Text style={styles.previewArrow}>→</Text>
                      <View style={styles.previewBlock}>
                        <Text style={styles.previewLabel}>AFTER</Text>
                        <Text style={styles.previewValue}>{afterScore}</Text>
                        <Text style={styles.previewBand}>{titleCase(afterBand)}</Text>
                      </View>
                    </View>
                  ) : null}

                  <Pressable onPress={() => setShowPreview((current) => !current)} style={styles.previewButton}>
                    <Text style={styles.previewButtonText}>{showPreview ? 'Hide preview' : 'Preview relief'}</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.noSuggestion}>All commitments in this pressure window are fixed.</Text>
              )}

              <Pressable onPress={() => setPressureSelection(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Back to timeline</Text></Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, minHeight: 0 },
  scoreBadge: { alignItems: 'center', flexDirection: 'row', gap: 10, position: 'absolute', right: 10, top: 96, zIndex: 15 },
  scoreLabel: { color: timelineTheme.colors.mutedText, fontSize: 11, fontWeight: '700' },
  scoreValue: { color: timelineTheme.colors.text, fontSize: 18, fontWeight: '800' },
  timeline: { flex: 1, flexDirection: 'row', minHeight: 0 },
  railColumn: { marginRight: 10, position: 'relative', width: 86 },
  railLine: { backgroundColor: timelineTheme.colors.rail, bottom: 0, position: 'absolute', right: 5, top: 0, width: 1 },
  tick: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', position: 'absolute', right: -1, transform: [{ translateY: -8 }], width: 86 },
  tickLabel: { color: timelineTheme.colors.mutedText, fontSize: 12, fontWeight: '500', marginRight: 12 },
  todayLabel: { color: timelineTheme.colors.text, fontWeight: '900' },
  tickDot: { backgroundColor: timelineTheme.colors.railDot, borderRadius: 5, height: 10, width: 10 },
  todayDot: { backgroundColor: timelineTheme.colors.active, shadowColor: timelineTheme.colors.active, shadowOpacity: 0.9, shadowRadius: 8 },
  laneField: { flex: 1, flexDirection: 'row', minHeight: 0, overflow: 'hidden', position: 'relative' },
  dismissLayer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 0 },
  overloadRegion: { alignItems: 'flex-end', backgroundColor: 'rgba(255, 117, 88, 0.10)', borderBottomColor: 'rgba(255, 147, 122, 0.36)', borderBottomWidth: 1, borderTopColor: 'rgba(255, 147, 122, 0.36)', borderTopWidth: 1, justifyContent: 'flex-start', left: 0, paddingRight: 8, paddingTop: 5, position: 'absolute', right: 0, zIndex: 2 },
  pressureLabel: { color: '#FFB09B', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'center', padding: 20 },
  modalBackdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  modalCard: { backgroundColor: '#121212', borderColor: timelineTheme.colors.outline, borderRadius: 16, borderWidth: 1, maxWidth: 420, padding: 18, width: '100%' },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  modalTitle: { color: timelineTheme.colors.text, flex: 1, fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statusBadge: { backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  detailGrid: { gap: 12, marginTop: 16 },
  detailRow: { gap: 4 },
  detailLabel: { color: timelineTheme.colors.mutedText, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  detailValue: { color: timelineTheme.colors.text, fontSize: 14, fontWeight: '500', lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { backgroundColor: '#1A1A1A', borderColor: timelineTheme.colors.outline, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { color: timelineTheme.colors.text, fontSize: 11, fontWeight: '700' },
  closeButton: { alignItems: 'center', backgroundColor: timelineTheme.colors.text, borderRadius: 12, marginTop: 18, paddingVertical: 12 },
  closeButtonText: { color: '#111111', fontSize: 14, fontWeight: '800' },
  pressureOverlay: { backgroundColor: 'rgba(0,0,0,0.58)', flex: 1, justifyContent: 'flex-end' },
  pressureCard: { backgroundColor: '#101010', borderColor: timelineTheme.colors.outline, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '82%', paddingBottom: 26, paddingHorizontal: 20, paddingTop: 10 },
  grabber: { alignSelf: 'center', backgroundColor: '#4A4A4A', borderRadius: 99, height: 4, marginBottom: 18, width: 42 },
  eyebrow: { color: '#FFB09B', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  pressureTitle: { color: timelineTheme.colors.text, fontSize: 24, fontWeight: '800', marginTop: 6 },
  pressureSubtitle: { color: timelineTheme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 8 },
  commitmentList: { borderTopColor: '#2A2A2A', borderTopWidth: 1, marginTop: 18 },
  pressureItem: { alignItems: 'center', borderBottomColor: '#232323', borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  pressureItemCopy: { flex: 1 },
  pressureItemTitle: { color: timelineTheme.colors.text, fontSize: 14, fontWeight: '700' },
  pressureItemMeta: { color: timelineTheme.colors.mutedText, fontSize: 11, marginTop: 3 },
  pressureDifficulty: { color: timelineTheme.colors.text, fontSize: 12, fontWeight: '800' },
  suggestionBox: { backgroundColor: '#171717', borderColor: '#343434', borderRadius: 16, borderWidth: 1, marginTop: 18, padding: 15 },
  suggestionLabel: { color: '#AFAFAF', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  suggestionTitle: { color: timelineTheme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 5 },
  suggestionText: { color: timelineTheme.colors.mutedText, fontSize: 12, lineHeight: 18, marginTop: 5 },
  previewRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 16 },
  previewBlock: { alignItems: 'center', flex: 1 },
  previewLabel: { color: timelineTheme.colors.mutedText, fontSize: 9, fontWeight: '800' },
  previewValue: { color: timelineTheme.colors.text, fontSize: 25, fontWeight: '900', marginTop: 2 },
  previewBand: { color: '#D6D6D6', fontSize: 11, fontWeight: '700' },
  previewArrow: { color: '#FFB09B', fontSize: 22 },
  previewButton: { alignItems: 'center', backgroundColor: timelineTheme.colors.text, borderRadius: 12, marginTop: 14, paddingVertical: 12 },
  previewButtonText: { color: '#111111', fontSize: 13, fontWeight: '800' },
  noSuggestion: { color: timelineTheme.colors.mutedText, fontSize: 12, marginTop: 18 },
  secondaryButton: { alignItems: 'center', marginTop: 12, paddingVertical: 11 },
  secondaryButtonText: { color: timelineTheme.colors.mutedText, fontSize: 13, fontWeight: '700' },
});
