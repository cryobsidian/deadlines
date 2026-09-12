import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CommitmentLane } from '@/components/CommitmentLane';
import { Runner } from '@/components/Runner';
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
import type { Commitment, TimeRange, WorkloadBand } from '@/types/commitment';

const fallbackTimelineHeight = 520;
const HOUR_MS = 60 * 60 * 1000;
const USER_GUTTER_WIDTH = 30;

type Props = {
  commitments: Commitment[];
  now: Date;
  range: TimeRange;
  windowStart: Date;
  windowEnd: Date;
  onUpdateCommitment?: (id: string, patch: Partial<Commitment>) => void;
};

type Selection = Commitment;

function formatTick(date: Date, range: TimeRange, now: Date) {
  if (range === 'day') return `${date.getHours().toString().padStart(2, '0')}:00`;
  if (date.toDateString() === now.toDateString()) return 'TODAY';
  return `${date.toLocaleString(undefined, { month: 'short' }).toUpperCase()} ${date.getDate()}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCompactDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDurationLabel(startAt: string, dueAt: string) {
  const ms = new Date(dueAt).getTime() - new Date(startAt).getTime();
  const days = Math.max(0, Math.round(ms / 86400000));
  return days <= 0 ? 'Less than a day' : `${days} day${days === 1 ? '' : 's'}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTopContentInset(height: number) {
  return clamp(height * 0.16, 84, 106);
}

function getPeriodMidpoint(period: OverloadPeriod) {
  return new Date((period.start.getTime() + period.end.getTime()) / 2);
}

function getPressureCommitments(commitments: Commitment[], period: OverloadPeriod) {
  const midpoint = getPeriodMidpoint(period);
  return commitments
    .filter((commitment) => isCommitmentActiveOn(commitment, midpoint))
    .sort((a, b) => {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
      const aRank = a.priority ? rank[a.priority] : 0;
      const bRank = b.priority ? rank[b.priority] : 0;
      return bRank - aRank || b.difficulty - a.difficulty;
    });
}

function getRebalanceCandidate(commitments: Commitment[]) {
  const flexible = commitments.filter((item) => item.flexibility === 'flexible');
  const droppable = commitments.filter((item) => item.flexibility === 'droppable');
  return flexible.at(-1) ?? droppable.at(-1);
}

function titleCase(value?: string) {
  if (!value) return 'Not set';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function workloadCopy(band: WorkloadBand) {
  if (band === 'overloaded') return 'OVERLOADED';
  if (band === 'strained') return 'STRAINED';
  if (band === 'busy') return 'BUSY';
  return 'MANAGEABLE';
}

function runnerFatigue(band: WorkloadBand) {
  if (band === 'overloaded') return 7;
  if (band === 'strained') return 5;
  if (band === 'busy') return 3;
  return 1;
}

function suggestedMove(candidate: Commitment, period: OverloadPeriod) {
  const duration = new Date(candidate.dueAt).getTime() - new Date(candidate.startAt).getTime();
  const newDueMs = period.start.getTime() - 2 * HOUR_MS;
  return {
    startAt: new Date(newDueMs - duration).toISOString(),
    dueAt: new Date(newDueMs).toISOString(),
  };
}

export function VerticalTimeline({ commitments, now, range, windowStart, windowEnd, onUpdateCommitment }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pressureSelection, setPressureSelection] = useState<OverloadPeriod | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [laneFieldSize, setLaneFieldSize] = useState({ height: fallbackTimelineHeight, width: 0 });

  const ticks = getVisibleDateTicks(range, windowStart);
  const overloadPeriods = identifyOverloadPeriods(commitments, windowStart, windowEnd);
  const activeCount = commitments.filter((commitment) => getCommitmentStatus(commitment, now) === 'active').length;
  const score = calculateWorkloadScore(commitments, now);
  const currentBand = getWorkloadBand(score);
  const timelineHeight = Math.max(1, laneFieldSize.height);
  const contentTopInset = getTopContentInset(timelineHeight);
  const contentHeight = Math.max(1, timelineHeight - contentTopInset);
  const currentY = contentTopInset + (1 - getTimePosition(now, windowStart, windowEnd)) * contentHeight;
  const runnerTop = clamp(currentY - 31, contentTopInset + 36, timelineHeight - 58);

  const pressureItems = pressureSelection ? getPressureCommitments(commitments, pressureSelection) : [];
  const rebalanceCandidate = getRebalanceCandidate(pressureItems);
  const pressureMidpoint = pressureSelection ? getPeriodMidpoint(pressureSelection) : null;
  const beforeScore = pressureMidpoint ? calculateWorkloadScore(commitments, pressureMidpoint) : 0;
  const afterScore = rebalanceCandidate ? Math.max(0, beforeScore - rebalanceCandidate.difficulty) : beforeScore;
  const beforeBand = getWorkloadBand(beforeScore);
  const afterBand = getWorkloadBand(afterScore);
  const proposedMove = useMemo(
    () => (rebalanceCandidate && pressureSelection ? suggestedMove(rebalanceCandidate, pressureSelection) : null),
    [rebalanceCandidate, pressureSelection],
  );

  function applyRebalance() {
    if (!rebalanceCandidate || !proposedMove || !onUpdateCommitment) return;
    onUpdateCommitment(rebalanceCandidate.id, proposedMove);
    setPressureSelection(null);
    setShowPreview(false);
  }

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

          <View pointerEvents="none" style={styles.statusReadout}>
            <View style={[styles.statusDot, currentBand === 'strained' && styles.statusDotStrained, currentBand === 'overloaded' && styles.statusDotOverloaded]} />
            <Text style={styles.statusReadoutText}>{workloadCopy(currentBand)}</Text>
          </View>

          {overloadPeriods.map((period) => {
            const startY = contentTopInset + (1 - getTimePosition(period.start, windowStart, windowEnd)) * contentHeight;
            const endY = contentTopInset + (1 - getTimePosition(period.end, windowStart, windowEnd)) * contentHeight;
            const top = Math.min(startY, endY);
            const bottom = Math.max(startY, endY);
            const regionHeight = Math.max(38, bottom - top);
            return (
              <Pressable
                accessibilityLabel="Review high pressure period"
                key={`${period.start.toISOString()}-${period.end.toISOString()}`}
                onPress={() => {
                  setPressureSelection(period);
                  setShowPreview(false);
                }}
                style={[styles.overloadRegion, { top, height: regionHeight }]}> 
                <Text style={styles.pressureLabel}>HIGH PRESSURE</Text>
              </Pressable>
            );
          })}

          <View pointerEvents="none" style={[styles.userRunner, { top: runnerTop }]}>
            <Runner fatigue={runnerFatigue(currentBand)} scale={0.72} />
          </View>

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
            <View style={styles.detailCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalTitle}>{selection.title}</Text>
                  <Text style={styles.modalSummary}>{titleCase(selection.category)} · {titleCase(selection.priority)} · {titleCase(selection.flexibility)}</Text>
                </View>
                <View style={styles.headerActions}>
                  <View style={styles.statusBadge}><Text style={styles.statusText}>{getCommitmentStatus(selection, now).toUpperCase()}</Text></View>
                  <Pressable accessibilityLabel="Close details" onPress={() => setSelection(null)} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></Pressable>
                </View>
              </View>

              <View style={styles.detailDivider} />
              <View style={styles.dateGrid}>
                <Meta label="Starts" value={formatDateTime(selection.startAt)} />
                <Meta label="Due" value={formatDateTime(selection.dueAt)} />
              </View>
              <View style={styles.metaGrid}>
                <Meta label="Difficulty" value={selection.difficulty === 1 ? 'Easy' : selection.difficulty === 2 ? 'Medium' : 'Hard'} />
                <Meta label="Duration" value={getDurationLabel(selection.startAt, selection.dueAt)} />
              </View>
            </View>
          )}
        </View>
      </Modal>

      <Modal animationType="slide" onRequestClose={() => setPressureSelection(null)} statusBarTranslucent transparent visible={!!pressureSelection}>
        <View style={styles.pressureOverlay}>
          <Pressable onPress={() => setPressureSelection(null)} style={styles.modalBackdrop} />
          {pressureSelection && (
            <View style={styles.pressureCard}>
              <View style={styles.grabber} />
              <View style={styles.pressureHeader}>
                <View>
                  <Text style={styles.pressureDate}>{formatCompactDate(getPeriodMidpoint(pressureSelection))}</Text>
                  <Text style={styles.pressureTitle}>{pressureItems.length} commitments converge</Text>
                </View>
                <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>{workloadCopy(beforeBand)}</Text></View>
              </View>

              <ScrollView style={styles.pressureScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.commitmentList}>
                  {pressureItems.map((item) => (
                    <View key={item.id} style={styles.pressureItem}>
                      <View style={styles.timelineMini}><View style={styles.timelineMiniDot} /></View>
                      <View style={styles.pressureItemCopy}>
                        <Text style={styles.pressureItemTitle}>{item.title}</Text>
                        <Text style={styles.pressureItemMeta}>{titleCase(item.category)} · {titleCase(item.priority)} · {titleCase(item.flexibility)}</Text>
                      </View>
                      <Text style={styles.pressureDifficulty}>{item.difficulty}/3</Text>
                    </View>
                  ))}
                </View>

                {rebalanceCandidate && proposedMove ? (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionLabel}>SUGGESTED ADJUSTMENT</Text>
                    <Text style={styles.suggestionTitle}>Move “{rebalanceCandidate.title}” earlier</Text>
                    <Text style={styles.suggestionText}>Finish by {formatCompactDate(new Date(proposedMove.dueAt))} to remove it from the pressure window.</Text>

                    {showPreview ? (
                      <View style={styles.previewPanel}>
                        <View><Text style={styles.previewCaption}>BEFORE</Text><Text style={styles.previewNumber}>{beforeScore}</Text><Text style={styles.previewBand}>{workloadCopy(beforeBand)}</Text></View>
                        <Text style={styles.previewArrow}>→</Text>
                        <View><Text style={styles.previewCaption}>AFTER</Text><Text style={styles.previewNumber}>{afterScore}</Text><Text style={styles.previewBand}>{workloadCopy(afterBand)}</Text></View>
                      </View>
                    ) : null}

                    <View style={styles.rebalanceActions}>
                      <Pressable onPress={() => setShowPreview((value) => !value)} style={styles.previewButton}><Text style={styles.previewButtonText}>{showPreview ? 'Hide preview' : 'Preview change'}</Text></Pressable>
                      <Pressable disabled={!onUpdateCommitment} onPress={applyRebalance} style={[styles.applyButton, !onUpdateCommitment && styles.disabledButton]}><Text style={styles.applyButtonText}>Apply</Text></Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noSuggestion}>Everything in this pressure window is fixed.</Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <View style={styles.metaBlock}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  outer: { flex: 1, minHeight: 0 },
  timeline: { flex: 1, flexDirection: 'row', minHeight: 0 },
  railColumn: { marginRight: 9, position: 'relative', width: 58 },
  railLine: { backgroundColor: '#424242', bottom: 0, position: 'absolute', right: 4, top: 0, width: 1 },
  tick: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', position: 'absolute', right: -1, transform: [{ translateY: -7 }], width: 58 },
  tickLabel: { color: '#7F7F7F', fontSize: 9.5, fontWeight: '600', marginRight: 9 },
  todayLabel: { color: '#E9E6E2', fontWeight: '800' },
  tickDot: { backgroundColor: '#8E8E8E', borderRadius: 3, height: 6, width: 6 },
  todayDot: { backgroundColor: '#ECE9E5' },
  laneField: { flex: 1, flexDirection: 'row', minHeight: 0, overflow: 'hidden', paddingLeft: USER_GUTTER_WIDTH, position: 'relative' },
  dismissLayer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 0 },
  statusReadout: { alignItems: 'center', flexDirection: 'row', gap: 6, position: 'absolute', right: 6, top: 72, zIndex: 15 },
  statusDot: { backgroundColor: '#777', borderRadius: 4, height: 5, width: 5 },
  statusDotStrained: { backgroundColor: '#F39A84' },
  statusDotOverloaded: { backgroundColor: '#FF6F61' },
  statusReadoutText: { color: '#A5A5A5', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.8 },
  userRunner: { alignItems: 'center', left: 0, position: 'absolute', width: USER_GUTTER_WIDTH, zIndex: 18 },
  overloadRegion: { alignItems: 'flex-end', backgroundColor: 'rgba(207,103,82,0.055)', borderLeftColor: 'rgba(232,133,112,0.3)', borderLeftWidth: 1, borderRightColor: 'rgba(232,133,112,0.3)', borderRightWidth: 1, justifyContent: 'flex-start', left: USER_GUTTER_WIDTH, paddingRight: 7, paddingTop: 7, position: 'absolute', right: 0, zIndex: 2 },
  pressureLabel: { color: '#D98673', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.75, opacity: 0.86 },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.76)', flex: 1, justifyContent: 'center', padding: 18 },
  modalBackdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  detailCard: { backgroundColor: '#101010', borderColor: '#393939', borderRadius: 18, borderWidth: 1, maxWidth: 430, padding: 18, width: '100%' },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  modalTitleWrap: { flex: 1 },
  modalTitle: { color: '#F1EEEA', fontSize: 18, fontWeight: '800' },
  modalSummary: { color: '#7E7E7E', fontSize: 10.5, marginTop: 5 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusBadge: { backgroundColor: '#2B2B2B', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#ECE9E5', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.7 },
  closeButton: { alignItems: 'center', height: 24, justifyContent: 'center', width: 24 },
  closeButtonText: { color: '#8A8A8A', fontSize: 21, fontWeight: '300', lineHeight: 22 },
  detailDivider: { backgroundColor: '#252525', height: 1, marginTop: 16 },
  metaGrid: { flexDirection: 'row', gap: 16, marginTop: 16 },
  dateGrid: { flexDirection: 'row', gap: 16, marginTop: 16 },
  metaBlock: { flex: 1, minWidth: 110 },
  metaLabel: { color: '#747474', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.55, marginBottom: 5, textTransform: 'uppercase' },
  metaValue: { color: '#E7E4E0', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  pressureOverlay: { flex: 1, justifyContent: 'flex-end' },
  pressureCard: { backgroundColor: '#101010', borderColor: '#363636', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '78%', padding: 18 },
  grabber: { alignSelf: 'center', backgroundColor: '#494949', borderRadius: 999, height: 3, marginBottom: 18, width: 36 },
  pressureHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  pressureDate: { color: '#F1EEEA', fontSize: 17, fontWeight: '800' },
  pressureTitle: { color: '#858585', fontSize: 12, marginTop: 4 },
  alertBadge: { backgroundColor: '#E98D79', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  alertBadgeText: { color: '#1A0F0C', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.55 },
  pressureScroll: { marginTop: 18 },
  commitmentList: { gap: 3 },
  pressureItem: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  timelineMini: { alignItems: 'center', alignSelf: 'stretch', borderLeftColor: '#4D4D4D', borderLeftWidth: 1, justifyContent: 'center', marginLeft: 5, marginRight: 13, width: 1 },
  timelineMiniDot: { backgroundColor: '#F0EEEA', borderRadius: 4, height: 7, marginLeft: -1, width: 7 },
  pressureItemCopy: { flex: 1 },
  pressureItemTitle: { color: '#EDEAE6', fontSize: 13, fontWeight: '700' },
  pressureItemMeta: { color: '#777', fontSize: 9.5, marginTop: 3 },
  pressureDifficulty: { color: '#888', fontSize: 10, fontWeight: '800' },
  suggestionBox: { backgroundColor: '#151515', borderColor: '#333', borderRadius: 14, borderWidth: 1, marginTop: 18, padding: 14 },
  suggestionLabel: { color: '#7F7F7F', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.75 },
  suggestionTitle: { color: '#F0EDE9', fontSize: 14, fontWeight: '800', marginTop: 8 },
  suggestionText: { color: '#929292', fontSize: 11, lineHeight: 16, marginTop: 5 },
  previewPanel: { alignItems: 'center', borderTopColor: '#2E2E2E', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', marginTop: 14, paddingTop: 12 },
  previewCaption: { color: '#666', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  previewNumber: { color: '#F0EDE9', fontSize: 22, fontWeight: '800', marginTop: 2 },
  previewBand: { color: '#8E8E8E', fontSize: 9, fontWeight: '700' },
  previewArrow: { color: '#696969', fontSize: 20 },
  rebalanceActions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  previewButton: { alignItems: 'center', borderColor: '#393939', borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 12 },
  previewButtonText: { color: '#D9D6D2', fontSize: 11, fontWeight: '800' },
  applyButton: { alignItems: 'center', backgroundColor: '#F0EEEA', borderRadius: 10, flex: 1, paddingVertical: 12 },
  applyButtonText: { color: '#171717', fontSize: 11, fontWeight: '900' },
  disabledButton: { opacity: 0.35 },
  noSuggestion: { color: '#818181', fontSize: 11, marginTop: 18, textAlign: 'center' },
});