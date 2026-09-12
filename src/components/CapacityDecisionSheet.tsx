import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DailyCapacity } from '@/components/CapacityCheckIn';
import {
  addHours,
  calculateWorkloadScore,
  getCapacityThresholds,
  getWorkloadBand,
} from '@/domain/workload';
import type { Commitment, CommitmentPriority } from '@/types/commitment';

const priorityRank: Record<CommitmentPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function capacityLabel(capacity: DailyCapacity) {
  if (capacity === 'low') return 'Running low';
  if (capacity === 'good') return 'Good';
  return 'Okay';
}

function bandLabel(score: number) {
  const band = getWorkloadBand(score);
  if (band === 'overloaded') return 'OVERLOADED';
  if (band === 'strained') return 'STRAINED';
  if (band === 'busy') return 'BUSY';
  return 'MANAGEABLE';
}

function findRebalanceCandidate(commitments: Commitment[], now: Date) {
  return commitments
    .filter((item) => !item.completedAt && new Date(item.dueAt) > now && item.flexibility !== 'fixed')
    .sort((a, b) => {
      const aDrop = a.flexibility === 'droppable' ? 0 : 1;
      const bDrop = b.flexibility === 'droppable' ? 0 : 1;
      if (aDrop !== bDrop) return aDrop - bDrop;
      const aPriority = priorityRank[a.priority ?? 'medium'];
      const bPriority = priorityRank[b.priority ?? 'medium'];
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.difficulty - b.difficulty;
    })[0];
}

function findRecoveryWindow(commitments: Commitment[], now: Date) {
  const thresholds = getCapacityThresholds();
  let cursor = addHours(now, 3);
  const end = addHours(now, 24 * 7);

  while (cursor < end) {
    const windowEnd = addHours(cursor, 3);
    const midpoint = addHours(cursor, 1.5);
    const score = calculateWorkloadScore(commitments, midpoint);

    // Commitments can span several days, so "active" does not mean the user is
    // literally working every minute. A recovery opportunity is therefore a
    // low-load window, not a requirement for zero active commitments.
    if (score < thresholds.busy) {
      return { start: cursor, end: windowEnd };
    }
    cursor = addHours(cursor, 3);
  }

  return null;
}

function formatWindow(start: Date, end: Date) {
  const day = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${startTime}–${endTime}`;
}

export function CapacityDecisionSheet({
  commitments,
  capacity,
  now,
  visible,
  onClose,
  onMoveEarlier,
}: {
  commitments: Commitment[];
  capacity: DailyCapacity;
  now: Date;
  visible: boolean;
  onClose: () => void;
  onMoveEarlier: (id: string) => void;
}) {
  const [protectedWindow, setProtectedWindow] = useState<string | null>(null);
  const score = calculateWorkloadScore(commitments, now);
  const thresholds = getCapacityThresholds();
  const band = getWorkloadBand(score);
  const candidate = useMemo(() => findRebalanceCandidate(commitments, now), [commitments, now]);
  const recovery = useMemo(() => findRecoveryWindow(commitments, now), [commitments, now]);

  const capacityNote = capacity === 'low'
    ? `Today's capacity is lower, so strain begins at ${thresholds.strained} instead of the normal 7.`
    : capacity === 'okay'
      ? `Today has a little less room than a high-capacity day.`
      : `Today has enough room for the current workload before extra intervention is needed.`;

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.card}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>TODAY'S DECISION</Text>
              <Text style={styles.title}>{capacityLabel(capacity)} capacity</Text>
            </View>
            <View style={[styles.bandBadge, band === 'strained' && styles.bandWarm, band === 'overloaded' && styles.bandHot]}>
              <Text style={styles.bandText}>{bandLabel(score)}</Text>
            </View>
          </View>

          <View style={styles.summary}>
            <Text style={styles.score}>{score}</Text>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>current workload points</Text>
              <Text style={styles.summaryText}>{capacityNote}</Text>
            </View>
          </View>

          {band === 'manageable' || band === 'busy' ? (
            <View style={styles.calmBox}>
              <Text style={styles.sectionLabel}>SYSTEM DECISION</Text>
              <Text style={styles.actionTitle}>No forced adjustment needed</Text>
              <Text style={styles.actionText}>Deadlines will keep watching for convergence instead of moving work unnecessarily.</Text>
            </View>
          ) : candidate ? (
            <View style={styles.actionBox}>
              <Text style={styles.sectionLabel}>BEST ADJUSTMENT</Text>
              <Text style={styles.actionTitle}>Create room around “{candidate.title}”</Text>
              <Text style={styles.actionText}>It is {candidate.flexibility ?? 'flexible'} and lower priority than fixed commitments, so it is the safest item to move first.</Text>
              <Pressable onPress={() => onMoveEarlier(candidate.id)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Move earlier</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.calmBox}>
              <Text style={styles.sectionLabel}>SYSTEM DECISION</Text>
              <Text style={styles.actionTitle}>Protect recovery instead</Text>
              <Text style={styles.actionText}>The remaining commitments are fixed, so Deadlines will not suggest unrealistic schedule changes.</Text>
            </View>
          )}

          {recovery ? (
            <View style={styles.recoveryBox}>
              <View style={styles.recoveryHeader}>
                <View>
                  <Text style={styles.sectionLabel}>RECOVERY WINDOW</Text>
                  <Text style={styles.recoveryTime}>{formatWindow(recovery.start, recovery.end)}</Text>
                </View>
                <Text style={styles.recoveryMark}>○</Text>
              </View>
              <Text style={styles.actionText}>This is the first three-hour period where your predicted load stays below today's busy threshold.</Text>
              <Pressable
                onPress={() => setProtectedWindow(formatWindow(recovery.start, recovery.end))}
                style={[styles.secondaryButton, protectedWindow && styles.secondaryButtonActive]}>
                <Text style={styles.secondaryButtonText}>{protectedWindow ? 'Recovery protected' : 'Protect this time'}</Text>
              </Pressable>
              {protectedWindow ? <Text style={styles.protectedText}>Future rebalancing should avoid filling this window.</Text> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.66)', flex: 1, justifyContent: 'flex-end' },
  backdrop: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  card: { backgroundColor: '#101010', borderColor: '#343434', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, paddingBottom: 28 },
  grabber: { alignSelf: 'center', backgroundColor: '#4B4B4B', borderRadius: 999, height: 3, marginBottom: 20, width: 36 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: '#777', fontSize: 8.5, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#F1EFEC', fontSize: 20, fontWeight: '800', marginTop: 5 },
  bandBadge: { backgroundColor: '#242424', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  bandWarm: { backgroundColor: '#5B3028' },
  bandHot: { backgroundColor: '#7A3028' },
  bandText: { color: '#EEEAE5', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6 },
  summary: { alignItems: 'center', borderBottomColor: '#252525', borderBottomWidth: 1, flexDirection: 'row', gap: 14, marginTop: 18, paddingBottom: 18 },
  score: { color: '#F1EFEC', fontSize: 34, fontWeight: '800' },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: '#D8D5D1', fontSize: 11, fontWeight: '700' },
  summaryText: { color: '#7F7F7F', fontSize: 10, lineHeight: 15, marginTop: 4 },
  actionBox: { backgroundColor: '#151515', borderColor: '#333', borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 14 },
  calmBox: { marginTop: 18 },
  sectionLabel: { color: '#777', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.9 },
  actionTitle: { color: '#F0EDE9', fontSize: 14, fontWeight: '800', marginTop: 7 },
  actionText: { color: '#8A8A8A', fontSize: 10.5, lineHeight: 16, marginTop: 5 },
  primaryButton: { alignItems: 'center', backgroundColor: '#F0EEEA', borderRadius: 10, marginTop: 12, paddingVertical: 11 },
  primaryButtonText: { color: '#171717', fontSize: 11, fontWeight: '900' },
  recoveryBox: { borderTopColor: '#252525', borderTopWidth: 1, marginTop: 18, paddingTop: 18 },
  recoveryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  recoveryTime: { color: '#E8E5E1', fontSize: 13, fontWeight: '700', marginTop: 6 },
  recoveryMark: { color: '#8FAF95', fontSize: 20 },
  secondaryButton: { alignItems: 'center', borderColor: '#3A3A3A', borderRadius: 10, borderWidth: 1, marginTop: 12, paddingVertical: 11 },
  secondaryButtonActive: { backgroundColor: '#151A16', borderColor: '#49604E' },
  secondaryButtonText: { color: '#DAD7D2', fontSize: 11, fontWeight: '800' },
  protectedText: { color: '#78907D', fontSize: 9.5, marginTop: 8, textAlign: 'center' },
});